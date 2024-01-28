/**
 * Configures a (sub-)domain for integration with Mailgun.
 *
 * @param {string} name Record name or @ for root domain
 * @param {string} dkim DKIM record to deploy
 * @returns {DomainModifier[]} Generated records
 */
function DCL_MAILGUN(name, dkim) {
  return [
    MX(name, 10, "mxa.eu.mailgun.org."),
    MX(name, 10, "mxb.eu.mailgun.org."),
    TXT(name, "v=spf1 include:mailgun.org ~all"),
    TXT("email._domainkey." + name, dkim),
    CNAME("email." + name, "eu.mailgun.org."),
  ];
}
