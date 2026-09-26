function uppercase(value) {
    if (value === null || value === undefined) {
        return value;
    }

    return String(value).toUpperCase();
}


function lowercase(value) {
    if (value === null || value === undefined) {
        return value;
    }

    return String(value).toLowerCase();
}


function capitalize(value) {
    if (value === null || value === undefined) {
        return value;
    }

    return String(value)
        .toLowerCase()
        .replace(/\b\w/g, char => char.toUpperCase());
}


function trim(value) {
    if (value === null || value === undefined) {
        return value;
    }

    return String(value).trim();
}


function toNumber(value) {
    if (value === null || value === undefined || value === "") {
        return null;
    }

    const number = Number(value);

    return isNaN(number) ? null : number;
}


function toBoolean(value) {
    if (value === null || value === undefined) {
        return null;
    }

    const text = String(value).toLowerCase().trim();

    if (text === "true" || text === "1" || text === "yes") {
        return true;
    }

    if (text === "false" || text === "0" || text === "no") {
        return false;
    }

    return null;
}


function replace(value, search, replacement) {
    if (value === null || value === undefined) {
        return value;
    }

    return String(value).split(search).join(replacement);
}


function add(value, amount) {
    const number = Number(value);

    if (isNaN(number)) {
        return value;
    }

    return number + Number(amount);
}


module.exports = {
    uppercase,
    lowercase,
    capitalize,
    trim,
    toNumber,
    toBoolean,
    replace,
    add
};