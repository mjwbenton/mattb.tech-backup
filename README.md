# mattb.tech-backup

Makes a completely static copy of the website with all linked resources.

## Backlog

### Issues

- api.mattb.tech handling doesn't work because cloudfront can't get to the keys
- Handle 404s properly

### Better

- Create repo on github
- Special srcset handling
- Clean up API for creating new pages (it only works if we re-use the same page)

### Infrastructure

- Make something copy the latest over the current
- Make something invalidate cloudfront when appropriate
- Configure an alarm to email me
