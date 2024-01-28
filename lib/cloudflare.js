/**
 * Create a dummy record for Cloudflare with enabled proxying.
 * Can be used for things like page rules to trigger.
 *
 * @param {string} name Record name
 * @param {DomainModifier[]} name Generated records
 */
function DCL_CF_DUMMY(name) {
  return [A(name, "255.255.255.255", CF_PROXY_ON)];
}

/**
 * Create an alias record for CloudFlare Pages.
 * The project name should be specified without the .pages.dev suffix.
 *
 * @param {string} name Record name
 * @param {string} project Project name without .pages.dev
 * @param {DomainModifier[]} name Generated records
 */
function DCL_CF_PAGES(name, project) {
  return [ALIAS(name, project + ".pages.dev.", CF_PROXY_ON)];
}

/**
 * Creates a record pointing to a CloudFlare Argo Tunnel.
 * The tunnel ID should be specified without the .cfargotunnel.com suffix.
 * If the name is @, an ALIAS record will be created instead.
 *
 * @param {string} name Record name
 * @param {string} tunnel_id ID of the Argo Tunnel without .cfargotunnel.com
 * @param {...DomainModifier} modifiers Optional modifiers
 * @returns {DomainModifier[]} Generated records
 */
function DCL_CF_TUNNEL(name, tunnel_id) {
  /** @type {RecordModifier[]} */
  var modifiers = [].slice.call(arguments).slice(2);
  modifiers.push(CF_PROXY_ON);

  /** @type {DomainModifier[]} */
  var records = [];
  var tunnel_domain = tunnel_id + ".cfargotunnel.com.";

  if (name == "@") {
    records.push(ALIAS.apply(null, ["@", tunnel_domain].concat(modifiers)));
  } else {
    records.push(CNAME.apply(null, [name, tunnel_domain].concat(modifiers)));
  }

  return records;
}

/**
 * Create a helper function for DCL_CF_TUNNEL with pre-filled arguments.
 *
 * @param {string} tunnel_id ID of the Argo Tunnel without .cfargotunnel.com
 * @param {...DomainModifier} modifiers Optional modifiers
 * @returns {DomainModifier[]} Generated records
 */
function DCL_CF_TUNNEL_FN() {
  return DCL_PARTIAL(DCL_CF_TUNNEL, arguments);
}

/**
 * Create a proxied A/AAAA record for a given host.
 * If either IPv4 or IPv6 are null, the corresponding record will not be created.
 * Cloudflare Proxy and Universal SSL will be enabled.
 *
 * @param {string} name Record name
 * @param {string|null} ipv4 Optional IPv4 address
 * @param {string|null} ipv6 Optional IPv6 address
 * @returns {DomainModifier[]} Generated records
 */
function DCL_CF_WEB(name, ipv4, ipv6) {
  return [CF_UNIVERSALSSL_ON, DCL_HOST(name, ipv4, ipv6, CF_PROXY_ON)];
}

/**
 * Create a new redirect with CloudFlare Page Rules as an alias.
 * The target should specify the domain to which the redirect should point.
 * If the target is not specified, it will default to the current domain.
 * Based on the record name, one of the following redirects will be created:
 * - @: Redirects the root domain and www to the target
 * - *: Redirects the root domain and all subdomains to the target
 * - anything else: Redirects the subdomain to the target
 *
 * @param {string} name Record name
 * @param {string} domain Current domain
 * @param {string=} target Optional target domain, defaults to current domain
 * @returns {DomainModifier[]} Generated records
 */
function DCL_CF_WEB_ALIAS(name, domain, target) {
  target = target || domain;

  /** @type {DomainModifier[]} */
  var records = [CF_UNIVERSALSSL_ON];

  if (name == "@") {
    records.push(
      DCL_CF_DUMMY("@"),
      DCL_CF_DUMMY("www"),
      CF_REDIRECT(domain + "/*", "https://" + target + "/$1"),
      CF_REDIRECT("www." + domain + "/*", "https://" + target + "/$1")
    );
  } else if (name == "*") {
    records.push(
      DCL_CF_DUMMY("@"),
      DCL_CF_DUMMY("*"),
      CF_REDIRECT("*" + domain + "/*", "https://$1" + target + "/$2")
    );
  } else {
    records.push(
      DCL_CF_DUMMY(name),
      CF_REDIRECT(name + "." + domain + "/*", "https://" + target + "/$1")
    );
  }

  return records;
}
