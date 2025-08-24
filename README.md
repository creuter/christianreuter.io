# Christian Reuter - Personal Website

A lightweight single page application

## Development

### Running Locally

You can use any simple HTTP server to run the site locally:

```bash
# Python 3
python -m http.server 8000

# Python 2
python -m SimpleHTTPServer 8000

# PHP
php -S localhost:8000

# Node.js (if you have it installed)
npx serve .
```

Then open your browser to `http://localhost:8000`

## Production Deployment

### Apache (.htaccess)

If you're using Apache, create a `.htaccess` file with:

```apache
RewriteEngine On
RewriteCond %{REQUEST_FILENAME} !-f
RewriteCond %{REQUEST_FILENAME} !-d
RewriteRule ^ index.html [L]
```

### Nginx

Add this to your Nginx configuration:

```nginx
location / {
    try_files $uri $uri/ /index.html;
}
```

## License

MIT License - see LICENSE file for details.
