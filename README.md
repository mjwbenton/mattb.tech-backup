# mattb.tech-backup

Makes a completely static copy of my websites (mattb.tech, lonesome.mattb.tech) with all linked resources. Created mostly because I wanted to learn about puppeteer, but it's also provided a crude way for me to backup the data from other services (e.g. flickr) that these sites depend on.

## Packages

### @mattb.tech/backup-cdk

CDK stacks to schedule the backups and deploy the backed up versions of the sites.

- Uses StepFunctions to run the lambda functions defined in `@mattb.tech/backup-scraper` and `@mattb.tech/backup-copier`.
- Uses S3, Cloudfront and Route53 to host the backed-up copy

### @mattb.tech/backup-scraper

Uses puppeteer to traverse the site and copy its resources into an S3 bucket with a prefix of the current date and time. When it succeeds it returns the prefix it used.

### @mattb.tech/backup-copier

Recieves the prefix from `@mattb.tech/backup-scraper` and copies this version over the `current` folder, which is where the deployed version looks.

## Debugging

### View logs

Example insights query for scraper:

```
fields timestamp, level, source, error.message, message, url, path
| filter @requestId = '228f8ff1-afa6-47d7-9bfe-079081554d7a'
| filter level != 'debug'
| sort @timestamp asc
```

## Issues

- api.mattb.tech handling doesn't work because cloudfront can't get to the keys
- Handle 404s properly
- Special srcset handling so that it doesn't try to load images we haven't downloaded
- When it fails will leave non-working files around (should do clean-up on failure and maybe a retry?)
- Lazy-loading images?
