const oldupload = document.getElementById('oldupload');
const newupload = document.getElementById('newupload');

let old_script = null;
let new_script = null;
let old_hashes = new Map();
let old_paras = [];
let new_hashes = new Map();
let new_dom = [];

// const scriptupload = document.getElementById('scriptupload');
const container = document.getElementsByClassName('container')[0];

function create_scene_heading(txt) {
    let d = document.createElement('div');
    let p = document.createElement('p');
    p.innerHTML = txt;
    d.className = 'scene-heading';
    d.appendChild(p);
    return d;
}

function create_action(txt) {
    let d = document.createElement('div');
    let p = document.createElement('p');
    p.innerHTML = txt;
    d.className = 'action';
    d.appendChild(p);
    return d;
}

function create_character(txt) {
    let d = document.createElement('div');
    d.innerHTML = '<p></p>'+txt;
    d.className = 'character';
    return d;
}

function create_parenthetical(txt) {
    let d = document.createElement('div');
    d.innerHTML = txt;
    d.className = 'parenthetical';
    return d;
}

function create_dialogue(txt) {
    let d = document.createElement('div');
    d.innerHTML = txt;
    d.className = 'dialogue';
    return d;
}

function create_transition(txt) {
    let d = document.createElement('div');
    let p = document.createElement('p');
    p.innerHTML = txt;
    d.appendChild(p);
    d.className = 'transition';
    return d;
}


function create_shot(txt) {
    let d = document.createElement('div');
    let p = document.createElement('p');
    p.innerHTML = txt;
    d.appendChild(p);
    d.className = 'shot';
    return d;
}

function get_text(para) {
    let text = para.getElementsByTagName('Text')[0];
    return text.innerHTML;
}

function parseXML(/*e*/paragraph) {
    // let xml_test = e.target.result;
    // let parser = null;
    // parser = new DOMParser();
    // let xmlDoc = parser.parseFromString(xml_test, 'text/xml');
    // let content = xmlDoc.documentElement.getElementsByTagName('Content')[0];
    
    // for (let i=0; i < content.childNodes.length; i++) {
    
    //     let paragraph = content.childNodes[i];
    //     console.log(paragraph.textContent);
        try {
            let new_div = null;
            
            if(paragraph.nodeName === 'Paragraph' && paragraph.hasAttribute('Type')) {
                // let textNode = paragraph.getElementsByTagName('Text')[0];
                // console.log(textNode.innerHTML);
                let text = get_text(paragraph);
                switch(paragraph.getAttribute('Type')) {
                    case 'Scene Heading': new_div = create_scene_heading(text);
                                            break;
                    case 'Action': new_div = create_action(text);
                                            break;
                    case 'Character': new_div = create_character(text);
                                            break;
                    case 'Parenthetical': new_div = create_parenthetical(text);
                                            break;
                    case 'Dialogue': new_div = create_dialogue(text);
                                            break;
                    case 'Transition': new_div = create_transition(text);
                                            break;
                    case 'Shot': new_div = create_shot(text);
                                            break;
                }

                // if (new_div !== null || new_div !== undefined) 
                //     container.appendChild(new_div);
                return new_div;

            }

        } catch(e) {
            console.error(paragraph, e);
        }
    // }
}

// scriptupload.onchange = function(e) {
//     console.log('file uploaded');
//     const file = e.target.files[0];
//     const reader = new FileReader();
//     reader.addEventListener('load', parseXML);
//     reader.readAsText(file);
// };

async function get_hash_hex(para) {
    const uint8para = new TextEncoder().encode(para);
    const hashBuffer = await crypto.subtle.digest('SHA-256', uint8para);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    return hashHex;
}

function clean_container() {
    while(container.firstChild) container.removeChild(container.lastChild);
}

async function calculate_and_render() {
    old_hashes = new Map();
    // old_paras = [];
    clean_container();

    if(old_script.documentElement.getAttribute('Version') 
        !== new_script.documentElement.getAttribute('Version')) {
        let p = document.createElement('p');
        p.innerHTML = `Documents version mismatch`;
        container.appendChild(p);
        return;
    }

    let old_content = old_script.getElementsByTagName('Content')[0];
    for(let i = 0; i < old_content.childNodes.length; i++) {
        if(old_content.childNodes[i].nodeName === 'Paragraph') {
            let paragraphHex = await get_hash_hex(old_content.childNodes[i].textContent);
            if(!old_hashes.has(paragraphHex)) old_hashes.set(paragraphHex, [old_content.childNodes[i]]);
            else {
                let prev_list = old_hashes.get(paragraphHex);
                prev_list.push(old_content.childNodes[i]);
                old_hashes.set(paragraphHex, prev_list);
            }
            // old_paras.push(old_content.childNodes[i]);
        }
    }

    // console.log(old_hashes);
    // console.log(old_paras);
    // console.log(old_hashes[0], old_paras[0].textContent);
    // console.log(old_hashes[1], old_paras[1].textContent);


    let new_content = new_script.getElementsByTagName('Content')[0];
    new_hashes = [];
    for(let i = 0; i < new_content.childNodes.length; i++) {
        
        let paragraph = new_content.childNodes[i];
        if(paragraph.nodeName !== 'Paragraph') continue;
        let paragraphHex = await get_hash_hex(paragraph.textContent);
        // new_hashes.push(paragraphHex);
        let paraDiv = parseXML(paragraph);
        // let start_idx = 0;
        // let idx = -1;
        let same = false;
        if(paraDiv !== undefined && paraDiv !== null){
            // while((idx = old_hashes.indexOf(paragraphHex, start_idx)) !== -1) {
            //     // console.log('Entered while loop', idx);
            //     if(old_hashes[idx]==paragraphHex && 
            //         old_paras[idx].textContent == paragraph.textContent) {
            //         // paraDiv.className += ' highlight';
            //         same = true;
            //         // console.log(paragraph);
            //         start_idx = idx+1;
            //     }
            //     else if(old_hashes[idx]===paragraphHex) {
            //         start_idx = idx+1;
            //         // console.log(old_hashes[idx], old_paras[idx], paragraph);
            //     }
            //     else break;
            // }
            if(old_hashes.has(paragraphHex)) {
                console.log('Found match');
                for(let i = 0; i < old_hashes.get(paragraphHex).length; i++)
                    same |= (old_hashes.get(paragraphHex)[i].textContent == paragraph.textContent);
                        
            }
            if(!same)
                paraDiv.className += ' highlight';
            container.appendChild(paraDiv);
        }

    }
    console.log(old_hashes);
    // console.log(new_hashes);
}

oldupload.onchange = function(e) {
    const file = e.target.files[0];
    const reader = new FileReader();
    container.children = [];
    container.childNodes = [];
    reader.addEventListener('load', async function(evt) {
        let xml_test = evt.target.result;
        let parser = new DOMParser();
        old_script = parser.parseFromString(xml_test, 'text/xml');
        if(new_script !== null) await calculate_and_render();
    });
    reader.readAsText(file);
}

newupload.onchange = function(e) {
    const file = e.target.files[0];
    const reader = new FileReader();
    container.children = [];
    container.childNodes = [];

    reader.addEventListener('load', async function(evt) {
        let xml_test = evt.target.result;
        let parser = new DOMParser();
        new_script = parser.parseFromString(xml_test, 'text/xml');
        if(old_script !== null) await calculate_and_render();
    });
    reader.readAsText(file);
}