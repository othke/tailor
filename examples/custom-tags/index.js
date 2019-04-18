'use strict';

const http = require('http');
const path = require('path');
const url = require('url');
const processTemplate = require('../../lib/process-template');

const Tailor = require('../../');

const tailor = new Tailor({
    templatesPath: path.join(__dirname, 'templates'),
    handledTags: ['jsscript'],
    handleTag: (request, tag, options, context) => {
        if (tag && tag.name === 'jsscript') {
            const st = processTemplate(request, options, context);
            http.get('http://localhost:8081/jsscript', res => {
                let data = '';
                res.on('data', chunk => {
                    data += chunk;
                });
                res.on('end', () => {
                    options
                        .parseTemplate(data, null, false)
                        .then(parsedTemplate => {
                            parsedTemplate.forEach(item => {
                                console.log({ item });
                                st.write(item);
                            });
                            st.end();
                        });
                });
            });
            return st;
        }

        return '';
    }
});

// Root Server
http
    .createServer((req, res) => {
        if (req.url === '/favicon.ico') {
            res.writeHead(200, { 'Content-Type': 'image/x-icon' });
            return res.end('');
        }
        tailor.requestHandler(req, res);
    })
    .listen(8080, function() {
        console.log('Tailor server listening on port 8080');
    });

// Fragment server - Any http server that can serve fragments
http
    .createServer((req, res) => {
        const urlObj = url.parse(req.url, true);

        if (urlObj.pathname === '/jsscript') {
            res.setHeader('Content-Type', 'text/javascript');
            return res.end(`
                <script src='https://polyfill.io/v3/polyfill.js'></script>
            `);
        }

        res.writeHead(200, { 'Content-Type': 'text/javascript' });

        res.end('');
    })
    .listen(8081, function() {
        console.log('Fragment Server listening on port 8081');
    });
