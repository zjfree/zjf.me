registerPaint('rect', class {
    static get inputProperties() {
        return ['--color'];
    }
    static get contextOptions() {
        return { alpha: true };
    }

    color = null;

    size = 10;

    getColor(alpha) {
        const c = this.color;
        const r = c.r;
        const g = c.g;
        const b = c.b;
        const res = `rgba(${r}, ${g}, ${b}, ${alpha})`;
        return res;
    }

    parseColor(valStr) {
        let s = valStr.trim();
        if (s.startsWith('rgb')) {
            const nums = (s.match(/\d+/g) || []).map(Number);
            if (nums.length < 3) {
                return { r: 0, g: 255, b: 136, a: 1 };
            }
            return {
                r: nums[0],
                g: nums[1],
                b: nums[2],
                a: nums[3] ?? 1
            };
        }
        if (s.startsWith('#')) {
            let hex = s.replace('#', '');
            if (hex.length === 3) {
                hex = hex[0] + hex[0] + hex[1] + hex[1] + hex[2] + hex[2];
            }
            return {
                r: parseInt(hex.slice(0, 2), 16),
                g: parseInt(hex.slice(2, 4), 16),
                b: parseInt(hex.slice(4, 6), 16),
                a: 1
            };
        }
        return { r: 0, g: 255, b: 136, a: 1 };
    }

    getSize(w){
        // 原实现的 while 循环恒等于 20（20 % 20 === 0 立即 break），这里保留其实际结果
        const base = 20;
        if (!Number.isFinite(w) || w <= 0) return base;
        return base + (w % base) / base;
    }

    paint(ctx, geom, properties) {
        const w = geom.width;
        const h = geom.height;
        if (!(w > 0 && h > 0)) return;

        const str = properties.get('--color').toString();
        this.color = this.parseColor(str);

        // 兜底：size 不能为 0/NaN，否则下面的循环要么不画、要么不前进
        this.size = Math.max(8, this.getSize(Math.min(w, h)));

        ctx.lineWidth = 10;
        ctx.strokeStyle = this.getColor(0.1);

        const margin = this.size / 20;
        const side = Math.max(0, this.size - margin * 2);
        const radius = Math.min(margin * 5, side / 2); // 圆角超过边长一半会画不出来
        for (let x=0; x<=w-this.size; x+=this.size)
        {
            for (let y=0; y<=h-this.size; y+=this.size)
            {
                ctx.beginPath();
                ctx.roundRect(x + margin, y + margin, side, side, radius);
                ctx.fillStyle = this.getColor(Math.random() * 0.7 + 0.3);
                ctx.fill();
            }
        }
    }
})

registerPaint('circle', class {
    static get contextOptions() {
        return { alpha: true };
    }

    getColor(s='80%', l='50%', a=0.3) {
        let h = Math.random() * 360;
        return `hsla(${h}, ${s}, ${l}, ${a})`;
    }

    paint(ctx, geom, properties) {
        const w = geom.width;
        const h = geom.height;
        if (!(w > 0 && h > 0)) return;

        let size = Math.min(w, h) / 5;

        for (let i=0; i<10; i++)
        {
            let cx1 = size / 2 + (w - size) * Math.random();
            let cy1 = size / 2 + (h - size) * Math.random();
            let cx2 = size / 2 + (w - size) * Math.random();
            let cy2 = size / 2 + (h - size) * Math.random();
            
            ctx.fillStyle = this.getColor();
            let r = size / 2 + (Math.random() - 0.5) * size / 5;
            for (let j=0; j<=10; j++)
            {
                let t = j / 10;
                
                const deltaY = 40;
                const ctlX = (cx1 + cx2) / 2;
                const ctlY = (cy1 + cy2) / 2 - deltaY;

                const x = (1-t)*(1-t)*cx1 + 2*(1-t)*t*ctlX + t*t*cx2;
                const y = (1-t)*(1-t)*cy1 + 2*(1-t)*t*ctlY + t*t*cy2;

                ctx.beginPath();
                ctx.arc(x, y, r * (0.5 + 0.5 * j / 10), 0, Math.PI * 2);
                ctx.fill();
            }
        }
    }
})
