(function () {

    let jnd = 2.3,
        factor = 2;

    // by https://github.com/georgybu
    let stdDev = values => {
        const average = (data) => data.reduce((sum, value) => sum + value, 0) / data.length;
        const avg = average(values);
        const diffs = values.map((value) => value - avg);
        const squareDiffs = diffs.map((diff) => diff * diff);
        const avgSquareDiff = average(squareDiffs);
        return Math.sqrt(avgSquareDiff);
    };

    // https://github.com/AbelVM/av.color
    let hexToRgb = hex => {
        hex = hex.toLowerCase();
        let shorthandRegex = /^#?([a-f\d])([a-f\d])([a-f\d])$/i,
            hex2 = hex.replace(shorthandRegex, function (m, r, g, b) {
                return r + r + g + g + b + b;
            }),
            result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex2);
        return result ? [
            parseInt(result[1], 16),
            parseInt(result[2], 16),
            parseInt(result[3], 16)
        ] : void 0;
    };

    // https://github.com/antimatter15/rgb-lab
    let RgbToLab = rgb => {
        let r = rgb[0] / 255,
            g = rgb[1] / 255,
            b = rgb[2] / 255,
            x, y, z;

        r = (r > 0.04045) ? Math.pow((r + 0.055) / 1.055, 2.4) : r / 12.92;
        g = (g > 0.04045) ? Math.pow((g + 0.055) / 1.055, 2.4) : g / 12.92;
        b = (b > 0.04045) ? Math.pow((b + 0.055) / 1.055, 2.4) : b / 12.92;

        x = (r * 0.4124 + g * 0.3576 + b * 0.1805) / 0.95047;
        y = (r * 0.2126 + g * 0.7152 + b * 0.0722) / 1.00000;
        z = (r * 0.0193 + g * 0.1192 + b * 0.9505) / 1.08883;

        x = (x > 0.008856) ? Math.pow(x, 1 / 3) : (7.787 * x) + 16 / 116;
        y = (y > 0.008856) ? Math.pow(y, 1 / 3) : (7.787 * y) + 16 / 116;
        z = (z > 0.008856) ? Math.pow(z, 1 / 3) : (7.787 * z) + 16 / 116;

        return {
            L: (116 * y) - 16,
            A: 500 * (x - y),
            B: 200 * (y - z)
        };
    };

    let hex2lab = hex => {
        let rgb = hexToRgb(hex);
        return RgbToLab(rgb);
    }

    // http://zschuessler.github.io/DeltaE/
    // de00.js

    let DE00 = colors => {
        let labs = colors.map(c => hex2lab(c)),
            deltas = [],
            delta;
        for (let i = 0; i < labs.length; i++) {
            let c1 = labs[i],
                delta = [];;
            for (let j = i + 1; j < labs.length; j++) {
                let c2 = labs[j],
                    d = new dE00(c1, c2);
                delta.push(d.getDeltaE());
            }
            deltas.push(delta);
        }
        return deltas;
    };

    let buildScale = colors => {
        let
            box = document.createElement('div'),
            text = '';
        box.className = 'scale';
        for (let c of colors) {
            text += `<div class="scaleitem" style="background:${c};" title="${c}"></div>`;
        }
        box.innerHTML = text;
        return box;
    }

    let valid = delta => {
        return (delta <= jnd) ? `<span class="bad">${delta}</span>` : delta;
    }

    let secDelta = deltas => {
        let sdeltas = deltas.map(d => Math.round(d[0], 1)),
            box = document.createElement('div'),
            text = '',
            txt1 = '',
            txt2 = '<a href="https://en.wikipedia.org/wiki/Color_difference#Tolerance">JND (just noticeable difference)</a> value, usually set to ~ 2.3 (Mahy et al., 1994)',
            l = sdeltas.length,
            stdev,
            vd,
            flag = false;
        sdeltas.pop();
        stedev = stdDev(sdeltas).toFixed(2);
        box.className = 'scale';
        box.style.width = (630 * (l - 1) / l) + 'px';
        for (let d of sdeltas) {
            vd = valid(d);
            if (vd != d) flag = true;
            text += `<div class="scaleitem cell">${vd}</div>`;
        }
        box.innerHTML = text;
        if (flag) txt1 = '<span class="bad">In this color scale some neighbor colors cannot be distinguished</span><br><br>'
        txt1 += `With the given input scale, the standard deviation of the calculated &Delta;E*<sub>00</sub> values is <b>${stedev}</b>: `;
        if (stedev <= jnd) {
            txt1 += `below the ${txt2}, so this scale is perceptually uniform.`;
        } else if (stedev > jnd && stedev <= jnd * factor) {
            txt1 += `in the order of ${(stedev/jnd).toFixed(1)} times the ${txt2}, so this scale is quite uniform.`;
        } else if (stedev > jnd * factor && stedev <= jnd * factor * 2) {
            txt1 += `in the order of ${(stedev/jnd).toFixed(1)} times the ${txt2}, so this scale is not so uniform.`;
        } else {
            txt1 += `way above the ${txt2}, <span class="bad">so this scale is not uniform at all</span>.`;
        }
        document.querySelector('#txt1').innerHTML = txt1;

        return box;
    }

    let fl = false;

    let buildArray = (colors, deltas) => {
        let
            l = colors.length + 1,
            w = 630 / l + 'px',
            cs = `flex-grow:0;width:${w};`,
            text = '',
            box = document.createElement('div'),
            firstrow = buildScale(colors),
            cornercell = document.createElement('div'),
            d,
            vd;

        box.className = 'scalebox';
        box.id = 's3';
        cornercell.className = 'scaleitem';
        firstrow.insertBefore(cornercell, firstrow.firstChild);
        box.appendChild(firstrow);

        for (let i = 1; i < l; i++) {
            let
                row = document.createElement('div'),
                delta = deltas[i - 1],
                cells = '';
            row.className = 'scale';
            for (let j = 0; j < l; j++) {
                let deltat = deltas[j - 1];
                vd = d = 0;
                if (j == 0) {
                    cells += `<div class="scaleitem" style="background:${colors[i-1]};${cs}" title="${colors[i-1]}"></div>`;
                } else if (j < i) {
                    d = Math.round(deltat[i - j - 1], 1);
                    vd = valid(d);
                    cells += `<div class="scaleitem cell" style="${cs}">${vd}</div>`;
                } else if (j == i) {
                    cells += `<div class="scaleitem cell" style="${cs}background:lightgray;">0</div>`;
                } else {
                    d = Math.round(delta[j - i - 1], 1);
                    vd = valid(d);
                    cells += `<div class="scaleitem cell" style="${cs}">${vd}</div>`;
                }
                if (vd != d) fl = true;
            }

            row.innerHTML = cells;
            box.appendChild(row);
        }

        return box;
    }

    let go = () => {
        let colors = document.querySelector('#inp').value.replace(/'|"| |\[|\]/g, "").split(','),
            deltas = DE00(colors),
            sec = document.querySelector('#s1'),
            arrblock = document.querySelector('#s2'),
            arr = document.querySelector('#s3'),
            wrn = document.querySelector('#wrn');;
        sec.innerHTML = '';
        sec.appendChild(buildScale(colors));
        sec.appendChild(secDelta(deltas));

        fl = false;
        if (arr != void 0) arr.remove();
        if (wrn != void 0) wrn.remove();

        arr = buildArray(colors, deltas);
        arrblock.appendChild(arr);

        if (fl) {
            let warning = document.createElement('p'),
                text = '<br><br><span class="bad">In this color scale some colors  cannot be distinguished</span><br><br>';
            warning.className = "CDB-Text CDB-Size-large";
            warning.id = 'wrn';
            warning.innerHTML = text;
            arrblock.appendChild(warning);
        }
    }

    let init = () => {
        let button = document.querySelector('#go');
        button.addEventListener('click', go);
        go();
    }

    window.onload = init;

})();