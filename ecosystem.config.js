module.exports = {
    apps: [{
        name: 'cotizador-mad',
        script: 'npm',
        args: 'start',
        cwd: '/var/www/cotizador-mad',
        instances: 1,
        autorestart: true,
        watch: false,
        max_memory_restart: '1G',
        env: {
            NODE_ENV: 'production',
            PORT: 3000
        },
        error_file: '/var/log/pm2/cotizador-mad-error.log',
        out_file: '/var/log/pm2/cotizador-mad-out.log',
        log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
        merge_logs: true,
        min_uptime: '10s',
        max_restarts: 10,
        restart_delay: 4000
    }]
}
