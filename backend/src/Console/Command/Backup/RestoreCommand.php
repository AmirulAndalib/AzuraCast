<?php

declare(strict_types=1);

namespace App\Console\Command\Backup;

use App\Console\Command\AbstractDatabaseCommand;
use App\Entity\StorageLocation;
use App\Utilities\Types;
use Exception;
use Symfony\Component\Console\Attribute\AsCommand;
use Symfony\Component\Console\Input\InputArgument;
use Symfony\Component\Console\Input\InputInterface;
use Symfony\Component\Console\Input\InputOption;
use Symfony\Component\Console\Output\OutputInterface;
use Symfony\Component\Console\Style\SymfonyStyle;
use Symfony\Component\Filesystem\Filesystem;

use const PATHINFO_EXTENSION;

#[AsCommand(
    name: 'azuracast:restore',
    description: 'Restore a backup previously generated by AzuraCast.',
)]
final class RestoreCommand extends AbstractDatabaseCommand
{
    protected function configure(): void
    {
        $this->addArgument('path', InputArgument::OPTIONAL)
            ->addOption('restore', null, InputOption::VALUE_NONE)
            ->addOption('release', null, InputOption::VALUE_NONE);
    }

    protected function execute(InputInterface $input, OutputInterface $output): int
    {
        $io = new SymfonyStyle($input, $output);

        $path = Types::stringOrNull($input->getArgument('path'), true);
        $startTime = microtime(true);

        $io->title('AzuraCast Restore');

        if (null === $path) {
            $filesRaw = glob(StorageLocation::DEFAULT_BACKUPS_PATH . '/*', GLOB_NOSORT) ?: [];
            usort(
                $filesRaw,
                static fn($a, $b) => filemtime($b) <=> filemtime($a)
            );

            if (0 === count($filesRaw)) {
                $io->getErrorStyle()
                    ->error('Backups directory has no available files. You must explicitly specify a backup file.');
                return 1;
            }

            $files = [];
            $i = 1;
            foreach ($filesRaw as $filePath) {
                $files[$i] = basename($filePath);

                if (10 === $i) {
                    break;
                }
                $i++;
            }

            $path = Types::string($io->choice('Select backup file to restore:', $files, 1));
        }

        if ('/' !== $path[0]) {
            $path = StorageLocation::DEFAULT_BACKUPS_PATH . '/' . $path;
        }

        if (!file_exists($path)) {
            $io->getErrorStyle()->error(
                sprintf(
                    __('Backup path %s not found!'),
                    $path
                )
            );
            return 1;
        }

        $io->writeln('Please wait while the backup is restored...');

        // Extract tar.gz archive
        $io->section('Extracting backup file...');

        $fileExt = strtolower(pathinfo($path, PATHINFO_EXTENSION));

        switch ($fileExt) {
            case 'tzst':
                $this->passThruProcess(
                    $output,
                    [
                        'tar',
                        '-I',
                        'unzstd',
                        '-xvf',
                        $path,
                    ],
                    '/'
                );
                break;

            case 'gz':
            case 'tgz':
                $this->passThruProcess(
                    $output,
                    [
                        'tar',
                        'zxvf',
                        $path,
                    ],
                    '/'
                );
                break;

            case 'zip':
            default:
                $this->passThruProcess(
                    $output,
                    [
                        'unzip',
                        '-o',
                        $path,
                    ],
                    '/'
                );
                break;
        }

        $io->newLine();

        // Handle DB dump
        $io->section('Importing database...');

        $pathDbDump = self::DB_BACKUP_PATH;
        $tmpDirMariadb = dirname($pathDbDump);

        try {
            $this->restoreDatabaseDump($io, $pathDbDump);
        } catch (Exception $e) {
            $io->getErrorStyle()->error($e->getMessage());
            return 1;
        } finally {
            (new Filesystem())->remove($tmpDirMariadb);
        }

        $io->newLine();

        // Update from current version to latest.
        $io->section('Running standard updates...');

        $this->runCommand($output, 'azuracast:setup', ['--update' => true]);

        $endTime = microtime(true);
        $timeDiff = $endTime - $startTime;

        $io->success(
            [
                'Restore complete in ' . round($timeDiff, 3) . ' seconds.',
            ]
        );
        return 0;
    }
}
