# mattb.tech-backup

Makes a completely static copy of the website with all linked resources.

## Backlog

### Issues

- Keep track of all URLs rewritten and then just go back to those rather than going through everything again?
- Refactor ResponseHandler

### Better

- api.mattb.tech handling
- Special srcset handling

### Infrastructure

- Make it run in a lambda and write to S3
- Have cloudfront pointing at current backup in a CDK stack
