/**
 * @typedef Ms365ServiceMap
 * @type {object}
 * @property {string=} mail Enable Exchange Online integration by specifying the mail identifier (e.g. example-com)
 */

/**
 * Configures a domain for integration with Microsoft 365.
 *
 * @param {string} code Verification code for this domain without MS=
 * @param {Ms365ServiceMap} services Map of services to enable for this domain
 * @returns {DomainModifier[]}
 */
function DCL_MICROSOFT365(code, services) {
  /** @type {DomainModifier[]} */
  var records = [TXT("@", "MS=" + code)];

  if (services && services.mail) {
    records.push(
      MX("@", 0, services.mail + ".mail.protection.outlook.com."),
      TXT("@", "v=spf1 include:spf.protection.outlook.com -all"),
      CNAME("autodiscover", "autodiscover.outlook.com.")
    );

    if (services.dkim) {
      for (var selector in services.dkim) {
        if (services.dkim.hasOwnProperty(selector)) {
          records.push(
            CNAME(selector + "._domainkey", services.dkim[selector])
          );
        }
      }
    } else {
      records.push(
        CNAME(
          "selector1._domainkey",
          "selector1-" + services.mail + "._domainkey.snapserv.onmicrosoft.com."
        ),
        CNAME(
          "selector2._domainkey",
          "selector2-" + services.mail + "._domainkey.snapserv.onmicrosoft.com."
        )
      );
    }
  }

  return records;
}
