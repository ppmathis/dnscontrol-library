/**
 * Helper function which calls the given factory with the current domain.
 * This allows creating domain-specific records without passing the domain name.
 * 
 * @param {function(string): DomainModifier|void} factory
 * @returns {function(Domain): void} Generated wrapper function
 */
function DCL_UTIL_DOMAIN(factory) {
    return function (domain) {
        var modifiers = factory(domain.name);
        if (modifiers) {
            processDargs(modifiers, domain);
        }
    };
}

/**
 * Transforms a potentially partial name into a fully qualified domain name.
 * If the name ends with a dot, it is considered absolute and returned as-is.
 *
 * @param {string} domain
 * @param {string} name
 * @return {string}
 */
function DCL_UTIL_FQDN(domain, name) {
    if (name.slice(-1) === ".") {
        return name;
    } else if (name !== "@") {
        return name + "." + domain + ".";
    } else {
        return domain + ".";
    }
}

/**
 * Generates a unique hash value for the given string input.
 * Requires no external dependencies and is similar to .hashCode() in Java.
 * 
 * @param {*} input 
 */
function DCL_UTIL_HASH(input) {
    var hash = 0;
    for (var i = 0; i < input.length; i++) {
        var character = input.charCodeAt(i);
        hash = ((hash << 5) - hash) + character;
        hash >>>= 0;
    }

    return hash.toString(16);
}
