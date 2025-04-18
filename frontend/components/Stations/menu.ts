import {useTranslate} from "~/vendor/gettext.ts";
import filterMenu, {MenuCategory, ReactiveMenu} from "~/functions/filterMenu.ts";
import {userAllowedForStation} from "~/acl.ts";
import {useAzuraCastStation} from "~/vendor/azuracast.ts";
import {computed} from "vue";
import {
    IconBroadcast,
    IconCode,
    IconImage,
    IconLibraryMusic,
    IconLogs,
    IconMic,
    IconPlaylist,
    IconPodcasts,
    IconPublic,
    IconReport
} from "~/components/Common/icons.ts";
import {reactiveComputed} from "@vueuse/core";
import {StationPermissions} from "~/entities/ApiInterfaces.ts";

export function useStationsMenu(): ReactiveMenu {
    const {$gettext} = useTranslate();
    const stationProps = useAzuraCastStation();

    // Reuse this variable to avoid multiple calls.
    const userCanManageMedia = userAllowedForStation(StationPermissions.Media);

    const menu: ReactiveMenu = reactiveComputed(
        () => {
            const profileMenu: MenuCategory = {
                key: 'profile',
                label: computed(() => $gettext('Profile')),
                icon: IconImage,
                items: [
                    {
                        key: 'view_profile',
                        label: computed(() => $gettext('View Profile')),
                        url: {
                            name: 'stations:index'
                        }
                    },
                    {
                        key: 'edit_profile',
                        label: computed(() => $gettext('Edit Profile')),
                        url: {
                            name: 'stations:profile:edit'
                        },
                        visible: userAllowedForStation(StationPermissions.Profile)
                    },
                    {
                        key: 'branding',
                        label: computed(() => $gettext('Branding')),
                        url: {
                            name: 'stations:branding'
                        },
                        visible: userAllowedForStation(StationPermissions.Profile)
                    }
                ]
            };

            const publicPageMenu: MenuCategory = {
                key: 'public_page',
                label: computed(() => $gettext('Public Page')),
                icon: IconPublic,
                url: stationProps.publicPageUrl,
                external: true,
                visible: stationProps.enablePublicPages,
            };

            const mediaMenu: MenuCategory = {
                key: 'media',
                label: computed(() => $gettext('Media')),
                icon: IconLibraryMusic,
                visible: stationProps.features.media,
                items: [
                    {
                        key: 'music_files',
                        label: computed(() => $gettext('Music Files')),
                        url: {
                            name: 'stations:files:index'
                        },
                        visible: userCanManageMedia
                    },
                    {
                        key: 'duplicate_songs',
                        label: computed(() => $gettext('Duplicate Songs')),
                        url: {
                            name: 'stations:files:index',
                            params: {
                                path: 'special:duplicates'
                            }
                        },
                        visible: userCanManageMedia
                    },
                    {
                        key: 'unprocessable',
                        label: computed(() => $gettext('Unprocessable Files')),
                        url: {
                            name: 'stations:files:index',
                            params: {
                                path: 'special:unprocessable'
                            }
                        },
                        visible: userCanManageMedia
                    },
                    {
                        key: 'unassigned',
                        label: computed(() => $gettext('Unassigned Files')),
                        url: {
                            name: 'stations:files:index',
                            params: {
                                path: 'special:unassigned'
                            }
                        },
                        visible: userCanManageMedia
                    },
                    {
                        key: 'ondemand',
                        label: computed(() => $gettext('On-Demand Media')),
                        url: stationProps.onDemandUrl,
                        external: true,
                        visible: stationProps.enableOnDemand,
                    },
                    {
                        key: 'sftp_users',
                        label: computed(() => $gettext('SFTP Users')),
                        url: {
                            name: 'stations:sftp_users:index'
                        },
                        visible: userCanManageMedia && stationProps.features.sftp,
                    },
                    {
                        key: 'bulk_media',
                        label: computed(() => $gettext('Bulk Media Import/Export')),
                        url: {
                            name: 'stations:bulk-media'
                        },
                        visible: userCanManageMedia
                    }
                ]
            };

            const playlistsMenu: MenuCategory = {
                key: 'playlists',
                label: computed(() => $gettext('Playlists')),
                icon: IconPlaylist,
                url: {
                    name: 'stations:playlists:index'
                },
                visible: userCanManageMedia && stationProps.features.media,
            };

            const podcastsMenu: MenuCategory = {
                key: 'podcasts',
                label: computed(() => $gettext('Podcasts')),
                icon: IconPodcasts,
                url: {
                    name: 'stations:podcasts:index'
                },
                visible: userAllowedForStation(StationPermissions.Podcasts) && stationProps.features.podcasts,
            };

            const streamingMenu: MenuCategory = {
                key: 'streaming',
                label: computed(() => $gettext('Live Streaming')),
                icon: IconMic,
                visible: userAllowedForStation(StationPermissions.Streamers) && stationProps.features.streamers,
                items: [
                    {
                        key: 'streamers',
                        label: computed(() => $gettext('Streamer/DJ Accounts')),
                        url: {
                            name: 'stations:streamers:index',
                        },
                        visible: userAllowedForStation(StationPermissions.Streamers)
                    },
                    {
                        key: 'webdj',
                        label: computed(() => $gettext('Web DJ')),
                        url: stationProps.webDjUrl,
                        external: true,
                        visible: stationProps.enablePublicPages
                    }
                ]
            };

            const webhooksMenu: MenuCategory = {
                key: 'webhooks',
                label: computed(() => $gettext('Web Hooks')),
                icon: IconCode,
                url: {
                    name: 'stations:webhooks:index'
                },
                visible: userAllowedForStation(StationPermissions.WebHooks) && stationProps.features.webhooks,
            };

            const reportsMenu: MenuCategory = {
                key: 'reports',
                label: computed(() => $gettext('Reports')),
                icon: IconReport,
                visible: userAllowedForStation(StationPermissions.Reports),
                items: [
                    {
                        key: 'reports_overview',
                        label: computed(() => $gettext('Station Statistics')),
                        url: {
                            name: 'stations:reports:overview',
                        }
                    },
                    {
                        key: 'reports_listeners',
                        label: computed(() => $gettext('Listeners')),
                        url: {
                            name: 'stations:reports:listeners'
                        }
                    },
                    {
                        key: 'reports_requests',
                        label: computed(() => $gettext('Song Requests')),
                        url: {
                            name: 'stations:reports:requests'
                        },
                        visible: userAllowedForStation(StationPermissions.Broadcasting) && stationProps.enableRequests
                    },
                    {
                        key: 'reports_timeline',
                        label: computed(() => $gettext('Song Playback Timeline')),
                        url: {
                            name: 'stations:reports:timeline'
                        }
                    },
                    {
                        key: 'reports_soundexchange',
                        label: computed(() => $gettext('SoundExchange Royalties')),
                        url: {
                            name: 'stations:reports:soundexchange'
                        }
                    }
                ]
            };

            const broadcastingMenu: MenuCategory = {
                key: 'broadcasting',
                label: computed(() => $gettext('Broadcasting')),
                icon: IconBroadcast,
                items: [
                    {
                        key: 'mounts',
                        label: computed(() => $gettext('Mount Points')),
                        url: {
                            name: 'stations:mounts:index',
                        },
                        visible: userAllowedForStation(StationPermissions.MountPoints) && stationProps.features.mountPoints
                    },
                    {
                        key: 'hls_streams',
                        label: computed(() => $gettext('HLS Streams')),
                        url: {
                            name: 'stations:hls_streams:index',
                        },
                        visible: userAllowedForStation(StationPermissions.MountPoints) && stationProps.features.hlsStreams
                    },
                    {
                        key: 'remotes',
                        label: computed(() => $gettext('Remote Relays')),
                        url: {
                            name: 'stations:remotes:index',
                        },
                        visible: userAllowedForStation(StationPermissions.RemoteRelays) && stationProps.features.remoteRelays
                    },
                    {
                        key: 'fallback',
                        label: computed(() => $gettext('Custom Fallback File')),
                        url: {
                            name: 'stations:fallback'
                        },
                        visible: userAllowedForStation(StationPermissions.Broadcasting) && stationProps.features.media
                    },
                    {
                        key: 'ls_config',
                        label: computed(() => $gettext('Edit Liquidsoap Configuration')),
                        url: {
                            name: 'stations:util:ls_config'
                        },
                        visible: userAllowedForStation(StationPermissions.Broadcasting)
                            && stationProps.features.customLiquidsoapConfig
                    },
                    {
                        key: 'stereo_tool',
                        label: computed(() => $gettext('Upload Stereo Tool Configuration')),
                        url: {
                            name: 'stations:stereo_tool_config'
                        },
                        visible: stationProps.features.media && userAllowedForStation(StationPermissions.Broadcasting)
                    },
                    {
                        key: 'queue',
                        label: computed(() => $gettext('Upcoming Song Queue')),
                        url: {
                            name: 'stations:queue:index',
                        },
                        visible: userAllowedForStation(StationPermissions.Broadcasting) && stationProps.features.autoDjQueue
                    },
                    {
                        key: 'restart',
                        label: computed(() => $gettext('Restart Broadcasting')),
                        url: {
                            name: 'stations:restart:index',
                        },
                        visible: userAllowedForStation(StationPermissions.Broadcasting)
                    }
                ]
            };

            const logsMenu: MenuCategory = {
                key: 'logs',
                label: computed(() => $gettext('Logs')),
                icon: IconLogs,
                url: {
                    name: 'stations:logs'
                },
                visible: userAllowedForStation(StationPermissions.Logs)
            };

            return {
                categories: [
                    profileMenu,
                    publicPageMenu,
                    mediaMenu,
                    playlistsMenu,
                    podcastsMenu,
                    streamingMenu,
                    webhooksMenu,
                    reportsMenu,
                    broadcastingMenu,
                    logsMenu
                ]
            }
        }
    ) as unknown as ReactiveMenu;

    return filterMenu(menu);
}
