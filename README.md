# mattb.tech-backup

Makes a completely static copy of the website with all linked resources.

## Backlog

### Issues

- api.mattb.tech handling doesn't work because cloudfront can't get to the keys
- Handle 404s properly
- Need to avoid persisted query cache misses

### Better

- Special srcset handling

### Infrastructure

- Make it run in a lambda and write to S3
