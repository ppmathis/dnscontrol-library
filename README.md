# DNSControl Library

An inofficial repository maintaining public helper functions and templates for usage with the great [DNSControl](https://docs.dnscontrol.org/) tool. DNSControl allows you to fully manage your DNS records in a version controlled way with a flexible and powerful JavaScript based configuration language. To prevent repetion across similar DNS zones, helper functions can be created for common tasks and shared across multiple zones.

This repository provides various of these helper functions, always prefixed with `DCL_` to avoid name collisions. You can either individual snippets from the `lib` folder or include the `index.js` in the top-level of this repository to include all functions at once. All the respective functions along with JSDoc documentation can be found in the `lib` folder.

## Usage
The easiest way to get this library into your own DNSControl repository is to use Git submodules. In your DNSControl repository, run the following command to add this repository as a submodule:

```bash
git submodule add -b main https://github.com/ppmathis/dnscontrol-library.git dcl
```

This will add the repository as a submodule in the `dcl` folder. You can then include the library in your DNSControl configuration by adding the following line to the top of your `config.js`:

```javascript
require('./dcl/index.js')
```

To update the library to the latest version, run the following command:

```bash
git submodule update --remote
```

If you are looking to integrate this with your CI/CD pipeline, make sure to also fetch Git submodules accordingly. When using GitHub actions, the following workflow template can be used:

```yaml
name: CI
on: push

jobs:
  dnscontrol:
    runs-on: ubuntu-latest
    container:
      image: docker.io/stackexchange/dnscontrol:4.8.2
    steps:
      - name: Install Git for checkout
        run: |
          apk add --no-cache git

      - uses: actions/checkout@v4
        with:
          submodules: true

      - name: Verify DNS configuration
        run: |
          dnscontrol version
          dnscontrol check

      - name: Push DNS configuration
        run: |
          dnscontrol push
        env:
          CLOUDFLARE_ACCOUNT_ID: ${{ secrets.CLOUDFLARE_ACCOUNT_ID }}
          CLOUDFLARE_API_TOKEN: ${{ secrets.CLOUDFLARE_API_TOKEN }}
        if: github.ref == 'refs/heads/main'
```
