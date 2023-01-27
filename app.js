
import fetch from 'node-fetch'
import fs  from 'fs';

const COURSE_URL = 'https://canvas.wisc.edu/api/v1'
const COURSE_ID = '83960000000345833'
const ASSIGNMENT_ID = '83960000001852525'
const SECRET = fs.readFileSync('./includes/token.secret')

let courseUrl = `${COURSE_URL}/courses/${COURSE_ID}/assignments/${ASSIGNMENT_ID}/submissions/?include[]=user&per_page=100`;

fetchLinkableData(courseUrl).then(data => {
    const results = data.map(submission => {
        return {
            name: submission.user.name,
            git: cleanStr(submission.body)
        }
    })
    const completeResults = results.filter(p => p.git)
    const missingSubmissions = results.filter(p => !p.git)
    fs.writeFileSync("outputs/missing.csv", missingSubmissions.map(p => p.name).join("\n"));
    fs.writeFileSync("outputs/git.csv", completeResults.map(p => `${p.name},${p.git}`).join("\n"));
});

async function fetchLinkableData(url) {
    const resp = await fetch(url, {
        method: 'GET',
        headers: {
            'Authorization': 'Bearer ' + SECRET
        }
    })
    const lnks = parse_link_header(resp.headers.get('Link'));
    const data = await resp.json();
    if (lnks.next) {
        return data.concat(await fetchLinkableData(lnks.next));
    } else {
        return data;
    }
}

function cleanStr(str) {
    return str ? str
        .replaceAll("<p>", "")
        .replaceAll("</p>", "")
        .replaceAll("<span>", "")
        .replaceAll("</span>", "")
        .replaceAll("@", "") : undefined
}

// https://gist.github.com/niallo/3109252?permalink_comment_id=1474669#gistcomment-1474669
function parse_link_header(header) {
    if (header.length === 0) {
        throw new Error("input must not be of zero length");
    }

    // Split parts by comma
    var parts = header.split(',');
    var links = {};
    // Parse each part into a named link
    for(var i=0; i<parts.length; i++) {
        var section = parts[i].split(';');
        if (section.length !== 2) {
            throw new Error("section could not be split on ';'");
        }
        var url = section[0].replace(/<(.*)>/, '$1').trim();
        var name = section[1].replace(/rel="(.*)"/, '$1').trim();
        links[name] = url;
    }
    return links;
}