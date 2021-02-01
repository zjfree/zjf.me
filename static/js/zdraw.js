// zdraw.js 绘图基础类  zjfree by 2021-01-19

// 点
class ZPoint{
    constructor(x, y) {
        this.x = x;
        this.y = y;
    }

    toString() {
        return '' + this.x + ',' + this.y;
    }

    // 获取中心点
    pointCenter(p) {
        let p1 = {
            x: (this.x + p.x) / 2,
            y: (this.y + p.y) / 2,
        };

        return p1;
    }

    // 在指定角度移动距离
    goDeg(deg, len) {
        deg = deg * Math.PI / 180;
        let x = this.x + Math.cos(deg) * len;
        let y = this.y + Math.sin(deg) * len;

        return new ZPoint(x, y);
    }

    // 两点间距离
    getDist(p) {
        let c1 = this.x - p.x;
        let c2 = this.y - p.y;
        let len = Math.sqrt(c1 * c1 + c2 * c2);

        return len;
    }

    // 两点间角度
    getDeg(p) {
        let deg = Math.atan2(p.y - this.y, p.x - this.x) / (Math.PI / 180);

        return deg;
    }

    // 增加
    add(p) {
        this.x += p.x;
        this.y += p.y;
    }
}

// 工具类
class ZTool{
	static strInfo = '';
    static strInfoTimer = null;
    static strInfoLastTime = 0;
    static fpsList = [];
    static strInfoEl = '#divInfo';
	static rand(min1, max, dec) {
		dec = dec||0;
		let val = min1 + Math.random() * (max - min1);
		return Math.round(val * Math.pow(10, dec)) / Math.pow(10, dec);
	}
	static randColor(alpha, ext){
		ext = ext||'50%,50%';
		if (alpha)
		{
			return 'hsla(' + this.rand(0, 360) + ',' + ext + ',' + (this.rand(0, 100) / 100) + ')';
		}
		else
		{
			return 'hsl(' + this.rand(0, 360) + ',' + ext + ')';
		}
	}
	static showInfo(str, ms){
        ms = ms||0;
        if (ms > 0)
        {
            if (Date.now() - this.strInfoLastTime < ms)
            {
                return;
            }
        }
        else
        {
            this.strInfoLastTime = Date.now();
        }
		if (!this.strInfoTimer)
		{
			this.strInfoTimer = window.setInterval(function(){
				if (ZTool.strInfo == '') return;
				$(ZTool.strInfoEl).html(ZTool.strInfo);
				ZTool.strInfo = '';
			}, 100);
		}

		this.strInfo = str;
    }
    static fps()
	{
		let now = Date.now();
		this.fpsList.push(now);
		while (now - this.fpsList[0] > 1000)
		{
			this.fpsList.shift();
		}
		this.showInfo('FPS: ' + this.fpsList.length, 3000);
    }
    static formatDate(d){
        d = d || new Date();
    
        let f = (v) => ('0' + v).substr(-2);
        return d.getFullYear() + '-'
            + f(d.getMonth() + 1) + '-'
            + f(d.getDate()) + ' '
            + f(d.getHours()) + ':'
            + f(d.getMinutes()) + ':'
            + f(d.getSeconds());
    }
}

// 绘图类
class ZDraw{
    width = 0;
    height = 0;
    size = 1;
    ctx = null;
    index = 0;
    isPlay = true;
    call_fn = null;
    isCenter = false;
    ratio = 1;
    renderStartTime = Date.now();
    el = null;
    constructor (el, fn) {
        this.el = el;
        this.call_fn = fn;
        this.ratio = window.devicePixelRatio;
        this.width = el.width() * this.ratio;
        this.height = el.height() * this.ratio;
        this.size = Math.min(this.width, this.height) / 100;
        el.prop('width', this.width);
        el.prop('height', this.height);
        this.ctx = el[0].getContext("2d");

        this.clear();
        let _this = this;
        window.requestAnimationFrame(function () {
            _this.render();
        });
    }
    toCenter() {
        this.ctx.translate(this.width / 2, this.height / 2);
        this.ctx.scale(1, -1);
        this.isCenter = true;
    }
    toNormal() {
        this.ctx.scale(1, -1);
        this.ctx.translate(-this.width / 2, -this.height / 2);
        this.isCenter = false;
    }
    stop () {
        this.isPlay = false;
    }
    play () {
        this.isPlay = true;
    }
    render () {
        let _this = this;
        if (!this.isPlay) {
            window.requestAnimationFrame(function () {
                _this.render();
            });

            return;
        }

        this.index++;
        if (this.call_fn) {
            this.call_fn(this.index, Date.now() - this.renderStartTime);
        }

        window.requestAnimationFrame(function () {
            _this.render();
        });
    }
    clear (color) {
        let s = Math.max(this.width, this.height) * 2;
        if (color)
        {
            this.ctx.fillStyle = color;
            this.ctx.fillRect(-s, -s, s * 2, s * 2);
        }
        else
        {
            this.ctx.clearRect(-s, -s, s * 2, s * 2);
        }
    }
    drawCircle (p, r, fillStyle='#ddd', strokeStyle=null) {
        this.ctx.beginPath();
        this.ctx.arc(p.x, p.y, r, 0, 2 * Math.PI);
        this.ctx.closePath();

        if (fillStyle) {
            this.ctx.fillStyle = fillStyle;
            this.ctx.fill();
        }
        if (strokeStyle) {
            this.ctx.strokeStyle = strokeStyle;
            this.ctx.stroke();
        }
    }
    drawLine (p1, p2, strokeStyle, lineWidth) {
        lineWidth = lineWidth || 1;
        strokeStyle = strokeStyle || '#f00';

        this.ctx.beginPath();
        this.ctx.moveTo(p1.x, p1.y);
        this.ctx.lineTo(p2.x, p2.y);

        this.ctx.lineWidth = lineWidth;
        this.ctx.strokeStyle = strokeStyle;
        this.ctx.stroke();
    }
    drawText (p, str, fillStyle, font) {
        if (this.isCenter)
        {
            this.ctx.scale(1, -1);
        }

        this.ctx.font = font || "16px Verdana";
        this.ctx.fillStyle = fillStyle || '#fff';
        this.ctx.fillText(str, p.x, this.isCenter ? -p.y : p.y);

        if (this.isCenter)
        {
            this.ctx.scale(1, -1);
        }
    }
    randPoint (){
        let p = null;
        if (this.isCenter)
        {
            p = new ZPoint(ZTool.rand(-this.width / 2, this.width / 2), ZTool.rand(-this.height / 2, this.height / 2));
        }
        else
        {
            p = new ZPoint(ZTool.rand(0, this.width), ZTool.rand(0, this.height));
        }
        return p;
    }
    getPoint (x, y){
        let p = new ZPoint(x * this.ratio, y * this.ratio);
        if (this.isCenter)
        {
            p.x = p.x - this.width / 2;
            p.y = this.height / 2 - p.y;
        }

        return p;
    }
    mouseDown (fn){
        let _this = this;
        this.el.mousedown(function(e) {
            let p = _this.getPoint(e.offsetX, e.offsetY);
            fn(p);
        });
    }
    mouseUp (fn){
        let _this = this;
        this.el.mouseup(function(e) {
            let p = _this.getPoint(e.offsetX, e.offsetY);
            fn(p);
        });
    }
    mouseDownMove (fn){
        let _this = this;
        this.el.mousemove(function(e) {
            if (e.buttons != 1) return;
            e.preventDefault();
            let p = _this.getPoint(e.offsetX, e.offsetY);
            fn(p);
        });
        this.el.bind('touchmove', function(e) {
            e.preventDefault();
            let p = _this.getPoint(e.targetTouches[0].clientX, e.targetTouches[0].clientY);
            fn(p);
        });
    }
};