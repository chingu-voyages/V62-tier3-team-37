<?php

namespace App\Console\Commands;

use Illuminate\Foundation\Console\ServeCommand as BaseServeCommand;
use Symfony\Component\Process\Process;

class ServeCommand extends BaseServeCommand
{
    /**
     * Start a new server process carrying the full, real environment.
     *
     * Herd's PHP 8.4 on Windows fails to bind its development-server socket
     * ("Failed to listen ... (reason: ?)") when the parent command strips
     * every non-whitelisted environment variable down to `false`. Passing
     * the real environment avoids that entirely. Equivalent to the stock
     * command run with `--no-reload`, without requiring the flag.
     *
     * @param  bool  $hasEnvironment
     * @return Process
     */
    protected function startProcess($hasEnvironment)
    {
        $env = [];

        foreach ($_ENV as $key => $value) {
            if (is_string($value)) {
                $env[$key] = $value;
            }
        }

        foreach (getenv() as $key => $value) {
            if (is_string($value)) {
                $env[$key] = $value;
            }
        }

        $env['PHP_CLI_SERVER_WORKERS'] = $this->phpServerWorkers;

        $process = new Process($this->serverCommand(), public_path(), $env);

        $this->trap(fn () => [SIGTERM, SIGINT, SIGHUP, SIGUSR1, SIGUSR2, SIGQUIT], function ($signal) use ($process) {
            if ($process->isRunning()) {
                $process->stop(10, $signal);
            }

            exit;
        });

        $process->start($this->handleProcessOutput());

        return $process;
    }
}
