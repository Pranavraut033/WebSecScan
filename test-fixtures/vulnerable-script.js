/**
 * INTENTIONALLY VULNERABLE JavaScript File
 * For testing WebSecScan static analysis
 * DO NOT USE IN PRODUCTION
 */

/* eslint-disable */
// Disable all linting for this intentionally vulnerable test file

// VULNERABILITY 1: Hardcoded credentials
const config = {
    apiKey: "AKIAIOSFODNN7EXAMPLE",  // AWS-like key
    secretKey: "wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY",
    dbPassword: "SuperSecret123!",
    privateKey: "-----BEGIN PRIVATE KEY-----\nMIIE..."
};

// VULNERABILITY 2: Use of eval()
function executeCode(userInput) {
    return eval(userInput); // Arbitrary code execution
}

// VULNERABILITY 3: new Function() constructor
function createDynamicFunction(code) {
    return new Function('return ' + code)();
}

// VULNERABILITY 4: innerHTML usage
function displayMessage(message) {
    document.getElementById('output').innerHTML = message; // XSS risk
}

// VULNERABILITY 5: More innerHTML patterns
function renderHTML(html) {
    const container = document.querySelector('.content');
    container.innerHTML = html; // Unsafe
}

// VULNERABILITY 6: eval in different contexts
function parseJSON(jsonString) {
    return eval('(' + jsonString + ')'); // Use JSON.parse instead!
}

// VULNERABILITY 7: Hardcoded tokens
const AUTH_TOKEN = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...";
const API_SECRET = "sk_test_4eC39HqLyjWDarjtT1zdp7dc";

// VULNERABILITY 8: Function constructor in class
class DynamicExecutor {
    execute(code) {
        const fn = Function(code); // Unsafe
        return fn();
    }
}

// VULNERABILITY 9: innerHTML in loop
function displayItems(items) {
    const list = document.getElementById('list');
    items.forEach(item => {
        list.innerHTML += '<li>' + item + '</li>'; // XSS + performance issue
    });
}

// VULNERABILITY 10: Reflected XSS helper
function getParameterAndDisplay(paramName) {
    const params = new URLSearchParams(window.location.search);
    const value = params.get(paramName);
    document.body.innerHTML += value; // Reflected XSS
}

// VULNERABILITY 11: More hardcoded secrets
const credentials = {
    username: "admin",
    password: "admin123", // Weak and hardcoded
    apiKey: "1234567890abcdef",
    accessToken: "ghp_1234567890abcdefghijklmnopqrstuvwxyz"
};

// VULNERABILITY 12: eval with template literal
function executeTemplate(template, data) {
    return eval(`\`${template}\``); // Template injection
}

// VULNERABILITY 13: setTimeout with string
function delayedExecution(code, ms) {
    setTimeout(code, ms); // Code as string is eval'd
}

// VULNERABILITY 14: setInterval with string
function repeatedExecution(code, ms) {
    setInterval(code, ms); // Same as eval
}

// VULNERABILITY 15: React-like dangerouslySetInnerHTML
function ReactComponent(props) {
    return {
        __html: props.userContent // dangerouslySetInnerHTML={{__html: ...}}
    };
}

// VULNERABILITY 16: More password exposure
function connectToDatabase() {
    const connection = {
        host: "localhost",
        user: "root",
        password: "rootpassword123", // Hardcoded DB password
        database: "production_db"
    };
    return connection;
}

// Safe functions (should not trigger)
function safeJSONParse(jsonString) {
    try {
        return JSON.parse(jsonString); // Safe
    } catch (e) {
        console.error('Parse error:', e);
        return null;
    }
}

function safeTextContent(text) {
    document.getElementById('output').textContent = text; // Safe
}

// Export for testing
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        executeCode,
        createDynamicFunction,
        displayMessage,
        renderHTML,
        config,
        credentials
    };
}
