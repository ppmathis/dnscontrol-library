/**
 * Creates a CNAME record for ACME challenges stored in another zone.
 * This allows verifying domain ownership without exposing the actual domain.
 * 
 * @param {string} name Record name
 * @param {string} zone Zone for ACME challenge records
 * @returns 
 */
function DCL_ACME(name, zone) {
  if (name !== "@") {
    name = "_acme-challenge." + name;
  } else {
    name = "_acme-challenge";
  }

  return DCL_UTIL_DOMAIN(function (domain) {
    var origin = DCL_UTIL_FQDN(domain, name);
    var target = DCL_UTIL_FQDN(zone, DCL_UTIL_HASH(origin));

    return CNAME(name, target);
  });
}

/**
 * Create a helper function for DCL_ACME with pre-filled arguments.
 * 
 * @param {string} zone 
 * @returns {function(string): DomainModifier}
 */
function DCL_ACME_FN(zone) {
  return DCL_PARTIAL(DCL_ACME, [zone]);
}

/**
 * Create a combined A and/or AAAA record for a given host.
 * If either IPv4 or IPv6 are null, the corresponding record will not be created.
 * Optional modifiers can be specified after the IP addresses.
 *
 * @param {string} name Record name
 * @param {string|null} ipv4 Optional IPv4 address
 * @param {string|null} ipv6 Optional IPv6 address
 * @param {...RecordModifier} modifiers Optional modifiers
 * @return {DomainModifier[]} Generated records
 */
function DCL_HOST(name, ipv4, ipv6) {
  /** @type {RecordModifier[]} */
  var modifiers = [].slice.call(arguments).slice(3);

  /** @type {DomainModifier[]} */
  var records = [];

  if (ipv4) {
    records.push(A.apply(null, [name, ipv4].concat(modifiers)));
  }
  if (ipv6) {
    records.push(AAAA.apply(null, [name, ipv6].concat(modifiers)));
  }

  return records;
}

/**
 * Create a helper function for DCL_HOST with pre-filled arguments.
 *
 * @param {string|null} ipv4 Optional IPv4 address
 * @param {string|null} ipv6 Optional IPv6 address
 * @param {...RecordModifier} modifiers Optional modifiers
 * @return {DomainModifier[]} Generated records
 */
function DCL_HOST_FN() {
  return DCL_PARTIAL(DCL_HOST, arguments);
}

/**
 * Creates a host record, analogous to DCL_HOST, but also creates PTR record(s).
 * The PTR records are auto-generated based on the IP addresses.
 *
 * @param {string} name Record name
 * @param {string|null} ipv4 Optional IPv4 address
 * @param {string|null} ipv6 Optional IPv6 address
 * @param {...RecordModifier} modifiers Optional modifiers
 * @return {DomainModifier[]} Generated records
 */
function DCL_HOST_PTR(name, ipv4, ipv6) {
  /** @type {RecordModifier[]} */
  var modifiers = [].slice.call(arguments).slice(3);

  /** @type {DomainModifier[]} */
  var records = [];

  // Support mapping additional IP addresses to same host
  var reverse = [ipv4, ipv6];
  if (typeof modifiers[0] === "object" && Array.isArray(modifiers[0])) {
    reverse = reverse.concat(modifiers.shift());
  }

  // Push host record and PTR records
  records.push(DCL_HOST(name, ipv4, ipv6));
  records.push(DCL_UTIL_DOMAIN(function (domain) {
    reverse
      .filter(function (alias) {
        return alias;
      })
      .map(function (alias) {
        var fqdn = DCL_UTIL_FQDN(domain, name);
        return [alias, PTR.apply(null, [alias, fqdn].concat(modifiers))];
      })
      .map(function (data) {
        D_EXTEND(REV(data[0]), data[1]);
      });
  }));

  return records;
}

/**
 * Prevents the current domain from sending any outgoing mail.
 * This is achieved by creating SPF, DKIM and DMARC records.
 *
 * @returns {DomainModifier[]} Generated records
 */
function DCL_MAIL_PREVENT() {
  return [
    TXT("@", "v=spf1 -all"),
    TXT("*._domainkey", "v=DKIM1; p="),
    TXT("_dmarc", "v=DMARC1; p=reject; sp=reject; adkim=s; aspf=s;"),
  ];
}

/**
 * Create a helper function which pre-fills all arguments except record name.
 * This can be used to deduplicate certain record arguments.
 *
 * @param {string} fn Function to partially apply
 * @param {any[]} args Arguments to partially apply
 * @returns {DomainModifier[]} Generated records
 */
function DCL_PARTIAL(fn, args) {
  args = [].slice.call(args);
  return function (name) {
    return fn.apply(null, [name].concat(args));
  };
}

/**
 * Create a new record for providing a website.
 * This function is similar to HOST, but will create a CNAME for www too.
 *
 * @param {string} name Record name
 * @param {string|null} ipv4 Optional IPv4 address
 * @param {string|null} ipv6 Optional IPv6 address
 * @param {...DomainModifier} modifiers Optional modifiers
 * @returns {DomainModifier[]} Generated records
 */
function DCL_WEB(name, ipv4, ipv6) {
  /** @type {RecordModifier[]} */
  var modifiers = [].slice.call(arguments).slice(3);

  /** @type {DomainModifier[]} */
  var records = DCL_HOST.apply(null, [name, ipv4, ipv6].concat(modifiers));

  if ((ipv4 || ipv6) && name == "@") {
    records.push(CNAME.apply(null, ["www", "@"].concat(modifiers)));
  }

  return records;
}

/**
 * Create a helper function for DCL_WWW with pre-filled arguments.
 *
 * @param {string|null} ipv4 Optional IPv4 address
 * @param {string|null} ipv6 Optional IPv6 address
 * @param {...DomainModifier} modifiers Optional modifiers
 * @returns {DomainModifier[]} Generated records
 */
function DCL_WEB_FN() {
  return DCL_PARTIAL(DCL_WEB, arguments);
}
