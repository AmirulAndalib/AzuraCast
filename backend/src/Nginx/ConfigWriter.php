<?php

declare(strict_types=1);

namespace App\Nginx;

use App\Entity\Station;
use App\Event\Nginx\WriteNginxConfiguration;
use App\Radio\Enums\BackendAdapters;
use App\Radio\Enums\FrontendAdapters;
use Symfony\Component\EventDispatcher\EventSubscriberInterface;

final class ConfigWriter implements EventSubscriberInterface
{
    /**
     * @return mixed[]
     */
    public static function getSubscribedEvents(): array
    {
        return [
            WriteNginxConfiguration::class => [
                ['writeRadioSection', 35],
                ['writeWebDjSection', 30],
                ['writeHlsSection', 25],
            ],
        ];
    }

    public function writeRadioSection(WriteNginxConfiguration $event): void
    {
        $station = $event->getStation();

        // Only forward local radio
        if (FrontendAdapters::Remote === $station->frontend_type) {
            return;
        }

        $listenBaseUrl = CustomUrls::getListenUrl($station);
        $listenBaseUrlForRegex = preg_quote($listenBaseUrl);
        $port = $station->frontend_config->port;

        $event->appendBlock(
            <<<NGINX
            location ~ ^({$listenBaseUrlForRegex}|/radio/{$port})\$ {
                return 302 \$uri/;
            }

            location ~ ^({$listenBaseUrlForRegex}|/radio/{$port})/(.*)\$ {
                include proxy_params;

                proxy_intercept_errors    on;
                proxy_next_upstream       error timeout invalid_header;
                proxy_redirect            off;
                proxy_connect_timeout     60;

                proxy_set_header Host \$host/{$listenBaseUrl};
                
                set \$args \$args&_ic2=1;
                proxy_pass http://127.0.0.1:{$port}/\$2?\$args;
            }
            NGINX
        );
    }

    public function writeWebDjSection(WriteNginxConfiguration $event): void
    {
        $station = $event->getStation();

        // Only forward Liquidsoap
        if (BackendAdapters::Liquidsoap !== $station->backend_type) {
            return;
        }

        $webDjBaseUrl = preg_quote(CustomUrls::getWebDjUrl($station));
        $autoDjPort = $station->backend_config->dj_port;

        $event->appendBlock(
            <<<NGINX
            # Reverse proxy the WebDJ connection.
            location ~ ^({$webDjBaseUrl}|/radio/{$autoDjPort})(/?)(.*)\$ {
                include proxy_params;

                proxy_pass http://127.0.0.1:{$autoDjPort}/$3;
            }
            NGINX
        );
    }

    public function writeHlsSection(WriteNginxConfiguration $event): void
    {
        $station = $event->getStation();

        if (!$station->enable_hls) {
            return;
        }

        $hlsBaseUrl = CustomUrls::getHlsUrl($station);
        $hlsFolder = $station->getRadioHlsDir();

        $hlsLogPath = self::getHlsLogFile($station);

        $event->appendBlock(
            <<<NGINX
            # Reverse proxy the frontend broadcast.
            location {$hlsBaseUrl} {
                location ~ \.m3u8$ {
                    access_log {$hlsLogPath} hls_json;
                }

                add_header 'Access-Control-Allow-Origin' '*';
                add_header 'Cache-Control' 'no-cache';

                alias {$hlsFolder};
                try_files \$uri =404;
            }
            NGINX
        );
    }

    public static function getHlsLogFile(Station $station): string
    {
        return $station->getRadioConfigDir() . '/hls.log';
    }
}
