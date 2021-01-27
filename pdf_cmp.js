var pdfjsLib = window['pdfjs-dist/build/pdf'];
var PAGE_NUMBER = 1;
var PAGE_SCALE = 1.5;
var SVG_NS = "http://www.w3.org/2000/svg";

// async function parsePDF(e) {
//     let pdfFile = await pdfjsLib.getDocument(/*e.target.result*/e).promise;
//     console.log(pdfFile);
//     console.log(pdfFile.numPages);
//     for(let i=1; i<=pdfFile.numPages; i++) {
//         pdfFile.getPage(i).then(async function(pdf){
//             let txtContent = await pdf.getTextContent();
//             // console.log(i, pdf, txtContent.items);
//         });
//     }
// }

let old_script = null;
let new_script = null;

let old_hashes = new Map();
let new_hashes = new Map();

const oldupload = document.getElementById('oldupload');
const newupload = document.getElementById('newupload');
const container = document.getElementsByClassName('container')[0];

async function get_hash_hex(para) {
    const uint8para = new TextEncoder().encode(para);
    const hashBuffer = await crypto.subtle.digest('SHA-256', uint8para);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    return hashHex;
}

function highlight_text(svg, text) {
    let rect = document.createElementNS(SVG_NS, "rect");
    let SVGRect = text.getBBox();
    rect.setAttribute("x", SVGRect.x);
    rect.setAttribute("y", SVGRect.y);
    rect.setAttribute("width", SVGRect.width);
    rect.setAttribute("height", SVGRect.height);
    rect.setAttribute("transform", `${text.getAttribute("transform")}`);
    rect.setAttribute("fill", "#27292c");
    svg.insertBefore(rect, text);
}

function add_line_break(svg) {
    let rect = document.createElementNS(SVG_NS, "rect");
    rect.setAttribute("x", );
}

async function calculate_and_render_from_pdf() {
    clean_container();
    container.style.padding = "0px";
    old_hashes = new Map();

    for(let i=1; i<=old_script.numPages; i++) {
        let page = await old_script.getPage(i);
        let txtContent = await page.getTextContent();
        txtContent.items.forEach(async txtItem => {

            if(txtItem.str.trim() !== '') {

                let textHex = await get_hash_hex(txtItem.str);
                if(!old_hashes.has(textHex)) old_hashes.set(textHex, [txtItem.str]);
                else {
                    let prev_list = old_hashes.get(textHex);
                    prev_list.push(txtItem.str);
                    old_hashes.set(textHex, prev_list);
                }

            }
            
        });
    }


    for(let i=1; i<=new_script.numPages; i++) {
        let svg = document.createElementNS(SVG_NS, "svg");
        container.appendChild(svg);

        let page = await new_script.getPage(i);
        let viewport = page.getViewport({ scale: PAGE_SCALE });

        svg.setAttribute("width", viewport.width + "px");
        svg.setAttribute("height", viewport.height + "px");
        svg.setAttribute("font-size", 1);

        let txtContent = await page.getTextContent();
        txtContent.items.forEach(async txtItem => {

            let tx = pdfjsLib.Util.transform(
                pdfjsLib.Util.transform(viewport.transform, txtItem.transform),
                [1, 0, 0, -1, 0, 0]
            );

            let style = txtContent.styles[txtItem.fontName];
            let text = document.createElementNS(SVG_NS, "text");
            text.setAttribute("transform", "matrix(" + tx.join(" ") + ")");
            text.setAttribute("font-family", style.fontFamily);
            text.textContent = txtItem.str;
            svg.appendChild(text);

            if(txtItem.str.trim() !== '') {
                let txtHex = await get_hash_hex(txtItem.str);
                let same = false;
                if(old_hashes.has(txtHex)) {
                    let match_list = old_hashes.get(txtHex);
                    match_list.forEach(txtStr => same |= (txtStr === txtItem.str));
                }
                if(!same) {
                    highlight_text(svg, text);
                    text.setAttribute("fill", "#ffffff");
                }
            } 

        });



        container.style.width = svg.getAttribute("width");
        // console.log(i, container.style.width, svg.getAttribute("width"));

    }
}

function clean_container() {
    while(container.firstChild) container.removeChild(container.lastChild);
}


oldupload.onchange = async function(e) {
    const file = e.target.files[0];
    old_script = await pdfjsLib.getDocument(URL.createObjectURL(file)).promise;
    console.log(old_script.numPages);
    if(old_script !== null && old_script !== undefined && new_script !== null && new_script !== undefined)
        await calculate_and_render_from_pdf();

}

newupload.onchange = async function(e) {
    const file = e.target.files[0];
    new_script = await pdfjsLib.getDocument(URL.createObjectURL(file)).promise;
    console.log(new_script.numPages);
    if(old_script !== null && old_script !== undefined && new_script !== null && new_script !== undefined)
        await calculate_and_render_from_pdf();
}