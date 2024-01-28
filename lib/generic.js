/**
 * Transforms a potentially partial name into a fully qualified domain name.
 * If the name ends with a dot, it is considered absolute and returned as-is.
 *
 * @param {Domain|string} domain
 * @param {string} name
 * @return {string}
 */
function DCL_FQDN(domain, name) {
  var domainName = typeof domain === "string" ? domain : domain.name;

  if (name.slice(-1) === ".") {
    return name;
  } else if (name !== "@") {
    return name + "." + domainName + ".";
  } else {
    return domainName + ".";
  }
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
  records.push(function (domain) {
    reverse
      .filter(function (alias) {
        return alias;
      })
      .map(function (alias) {
        return [
          alias,
          PTR.apply(null, [alias, DCL_FQDN(domain, name)].concat(modifiers)),
        ];
      })
      .map(function (data) {
        D_EXTEND(REV(data[0]), data[1]);
      });
  });

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
