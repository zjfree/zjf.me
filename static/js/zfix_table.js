/**
 * 基于canvas的表格绘制
 * zjfree by 2022-05-07
 */

class ZFixTable
{
    static DPI = window.devicePixelRatio;

    // 随机数字
    static rand(min, max) {
        let val = min + (max - min) * Math.random();
        return Math.round(val);
    }

    // 构造函数
    constructor (el, option)
    {
        // 配置
        this.option = {
            height: 'auto',
            scrollSize: 8,
            column: [],
            list: [],
            fontSize: '1rem',
            font: 'Consolas',
            borderColor: '',
            paddingX: 10,
            paddingY: 5,
            fixColumn: 0,
            hoverColor: '#eff',
            curColor: '#ffb',
            dataType: 'obj',	// 数据类型 obj:对象类型 arr:数组类型
            marginBottom: 10,
            btnCallback:null,
        };

        // 容器
        this._el = null;

        // 附加元素
        this.el_wh = $('<div class="el_wh"><div></div></div>');
        this.el_canvas_bkg = $('<canvas class="el_canvas_bkg"></canvas>');
        this.el_canvas = $('<canvas class="el_canvas"></canvas>');
        this.el_info = $('<div class="el_info"></div>');
        this.el_calc = $('<div class="el_calc"></div>');

        // 位置及宽高
        this.rect = { x: 0, y: 0, w: 0, h: 0 };

        // 字体大小
        this.fontSize = { en: 0, ch: 0, h: 0, space: 1 };

        // 行高
        this.lineHeight = 0;

        // 当前行
        this.curIndex = -1;

        // Hover行
        this.hoverIndex = -1;

        this.maxW = 0;
        this.maxH = 0;

        // 绘图对象
        this.ctx = null;
        this.ctxBkg = null;

        // 参考点
        this.pointList = [];

        // 绘制文字上偏移
        this.fontOffsetH = 0;

        // 按钮列表
        this.btnList = [];

        // 鼠标移动在BTN上
        this.hoverBtn = null;

        // 内部样式
        this.style = "\
            .zfix_table {border: solid 1px gray;position: relative;}\
            .zfix_table div, .zfix_table canvas{margin:0, padding:0, border:none}\
    		.zfix_table .el_wh {position: absolute; overflow: scroll; top: 0; left: 0; right: 0; bottom: 0; overscroll-behavior: contain;}\
    		.zfix_table .el_canvas, #divTable .el_canvas_bkg {position: absolute;	top: 0;	left: 0; right: 8px; bottom: 8px; }\
		    .zfix_table .el_info {position: absolute;	right: 0; top: -30px; color:blue; background-color: rgba(0,0,0,0.3); padding:5px 5px; font-size: 12px; z-index: 1; }\
    		.zfix_table .el_calc {position: absolute;	top: -1000px; margin: 0; padding: 0; line-height: 1;}\
    		.zfix_table .el_wh::-webkit-scrollbar {width: 8px; height: 8px;}\
    		.zfix_table .el_wh::-webkit-scrollbar-thumb {background: #666; }\
    		.zfix_table .el_wh::-webkit-scrollbar-track {background: #bbb;}\
        ";

        if ($('#zfix_table_style').length == 0)
        {
            let elStyle = $('<style id="zfix_table_style">' + this.style + '</style>');
            $('head').append(elStyle);
        }

        this.init(el, option||{});
    }

    // 初始化
    init (el, option) {
        let _this = this;
        this._el = el;
        this.option = $.extend(this.option, option);

        // 清空对象内容
        el.html('');
        el.addClass('zfix_table');

        // 边框颜色
        this.option.borderColor = this.option.borderColor || el.css('border-color');

        // 数组转为对象
        if (this.option.dataType == 'arr')
        {
            let list = [];
            for (let k in this.option.list)
            {
                let item = {};
                for (let kk in this.option.column)
                {
                    let r = this.option.column
                    item[r.code] = this.option.list[k][kk];
                }

                list.push(item);
            }

            this.option.list = list;
        }

        // 自适应高度
        if (this.option.height == 'auto') {
            this.resize(el);
            $(window).resize(function () {
                _this.resize(el);
            });
        }
        else {
            el.css('height', this.option.height);
            $(window).resize(function () {
                _this.changeSize();
            });
        }

        el.append(this.el_info);
        el.append(this.el_calc);

        // 计算字符大小
        this.calcCharSize();

        // 添加canvas
        el.append(this.el_canvas_bkg);
        el.append(this.el_canvas);

        // 计算列宽
        let colTotalWidth = 0;
        for (let k in this.option.column)
        {
            let r = this.option.column[k];
            r.width = r.width || 'auto';
            if (r.width == 'auto' || r.width.indexOf('+') === 0)
            {
                let addW = 0;
                if (r.width.indexOf('+') === 0)
                {
                    addW = this.calcCssWidth(r.width.substr(1));
                }

                let len = this.charLength(r.name);
                if (this.option.list.length > 0)
                {
                    let val = this.option.list[0][r.code];
                    let strMax = '';
                    if (typeof(val) == 'number')
                    {
                        strMax = this.option.list.map(x=>''+x[r.code]).sort(function(a,b){return b.length-a.length})[0] || '';
                    }
                    else
                    {
                        strMax = this.option.list.map(x=>x[r.code]).sort(function(a,b){return b.length-a.length})[0] || '';
                    }

                    len = Math.max(len, this.charLength(strMax));
                }
                
                r.width = len * this.fontSize.en + 2 * this.option.paddingX;
                r.width += addW;
            }
            else if (typeof(r.width) == 'string'){
                r.width = this.calcCssWidth(r.width);
            }

            colTotalWidth += r.width;
            r.width = Math.round(r.width * ZFixTable.DPI);
            r.width = Math.min(500, r.width);
            this.option.column[k] = r;
        }

        // 添加计算宽高容器
        el.append(this.el_wh);
        this.maxW = colTotalWidth;
        this.maxH = (this.option.list.length + 1) * this.lineHeight / ZFixTable.DPI;
        this.el_wh.find('div').css('min-width', this.maxW);
        this.el_wh.find('div').css('width', '100%');
        this.el_wh.find('div').css('height', this.maxH);
        this.el_wh.bind('scroll', function () { 
            _this.hoverBtn = null;
            _this.changeSize(); 
        });
        this.changeSize();

        // 点击事件
        this.el_wh.click(function (ev) {
            let y = ev.offsetY * ZFixTable.DPI;
            if (_this.hoverBtn && _this.option.btnCallback)
            {
                // 触发按钮事件
                _this.option.btnCallback(_this.hoverBtn);
            }

            _this.curIndex = Math.floor(y / _this.lineHeight) - 1;

            // _this.pointList.push({ x: x, y: y });
            _this.redrawBkg();
        });

        // hover行变色
        if (this.option.hoverColor) {
            this.el_wh.mousemove(function (ev) {
                let x = ev.offsetX * ZFixTable.DPI;
                let y = ev.offsetY * ZFixTable.DPI;
                _this.hoverIndex = Math.floor(y / _this.lineHeight) - 1;

                _this.checkBtn(x, y);
                _this.redrawBkg();
            });
        }
    }

    // 获取字符串长度，汉字2个长度
    charLength(str){
        str = '' + str;
        let len = 0;
        for (let i = 0; i < str.length; i++) {
            len += str.charCodeAt(i) < 128 ? 1 : 2;
        }
        return len;
    }

    // 计算字符宽度
    calcCharSize () {
        this.el_calc.css('width', 'auto');
        this.el_calc.css('font-size', this.option.fontSize);
        this.el_calc.css('font-family', this.option.font);
        this.el_calc.html('A');
        this.fontSize.en = this.el_calc.width();
        this.el_calc.html('中');
        this.fontSize.ch = this.el_calc.width();
        this.fontSize.h = this.el_calc.height();
        this.fontSize.space = 1;

        this.lineHeight = this.option.paddingY * 2 + this.fontSize.h;
        this.lineHeight = Math.round(this.lineHeight * ZFixTable.DPI);
    }

    // 获取CSS长度
    calcCssWidth(width){
        this.el_calc.css('width', width);
        return this.el_calc.width();
    }

    // 容器大小改变处理
    changeSize () {
        let cw = this._el.width() - this.option.scrollSize;
        let ch = this._el.height() - this.option.scrollSize;
        this.el_canvas.css('width', cw + 'px');
        this.el_canvas.css('height', ch + 'px');
        this.el_canvas_bkg.css('width', cw + 'px');
        this.el_canvas_bkg.css('height', ch + 'px');
        cw = cw * ZFixTable.DPI;
        ch = ch * ZFixTable.DPI;
        this.el_canvas.prop('width', cw);
        this.el_canvas.prop('height', ch);
        this.el_canvas_bkg.prop('width', cw);
        this.el_canvas_bkg.prop('height', ch);

        this.ctx = this.el_canvas[0].getContext('2d');
        this.ctxBkg = this.el_canvas_bkg[0].getContext('2d');
        this.ctx.textBaseline = 'middle';
        this.ctx.font = Math.round(this.fontSize.h * ZFixTable.DPI) + 'px ' + this.option.font;
        //this.el_canvas[0].style.letterSpacing = '1px';

        this.fontOffsetH = this.lineHeight * 0.5 + this.fontSize.h * ZFixTable.DPI * 0.15;

        this.rect = {
            x: Math.round(this.el_wh.scrollLeft() * ZFixTable.DPI),
            y: Math.round(this.el_wh.scrollTop() * ZFixTable.DPI),
            w: Math.round(cw),
            h: Math.round(ch),
        };

        this.showInfo('scroll:' + this.rect.x + ',' + this.rect.y);

        this.redraw();
    }

    // 自适应高度
    resize (el) {
        let h = $(window).height() - el.offset().top - this.option.marginBottom;
        el.css('height', h + 'px');
        this.changeSize();
    }

    // 显示信息
    showInfo (str) {
        this.el_info.html(str);
    }

    // 绘制背景
    redrawBkg () {
        if (!this.ctx) return;
        this.ctxBkg.clearRect(0, 0, this.rect.w, this.rect.h);
        
        // Hover行高亮
        if (this.hoverIndex >= 0 && this.hoverIndex < this.option.list.length) {
            let drawY = -this.rect.y + this.hoverIndex * this.lineHeight + this.lineHeight;
            this.ctxBkg.fillStyle = this.option.hoverColor;
            this.ctxBkg.fillRect(0, drawY, this.rect.w, this.lineHeight);
        }
        // 当前行高亮
        if (this.curIndex >= 0 && this.curIndex < this.option.list.length) {
            let drawY = -this.rect.y + this.curIndex * this.lineHeight + this.lineHeight;
            this.ctxBkg.fillStyle = this.option.curColor;
            this.ctxBkg.fillRect(0, drawY, this.rect.w, this.lineHeight);
        }

        if (this.hoverBtn)
        {
            this.roundRect(this.ctxBkg, this.hoverBtn.rect.x, this.hoverBtn.rect.y, this.hoverBtn.rect.w, this.hoverBtn.rect.h, 5);
            
            this.ctxBkg.fillStyle = '#66C9FA';
            this.ctxBkg.fill();
        }
    }

    // 重绘
    redraw () {
        if (!this.ctx) return;
        this.redrawBkg();
        this.btnList = [];

        this.ctx.clearRect(0, 0, this.rect.w, this.rect.h);

        // 画网格线
        this.ctx.lineWidth = 1;
        this.ctx.strokeStyle = this.option.borderColor;
        this.ctx.beginPath();

        let yStart = (-this.rect.y) % this.lineHeight;
        for (let y = yStart; y < this.rect.h; y += this.lineHeight) {
            this.ctx.moveTo(0, y);
            this.ctx.lineTo(this.rect.w, y);
        }

        let x = 0;
        for (let k in this.option.column)
        {
            let col = this.option.column[k];
            x += col.width;
            
            let x1 = x - this.rect.x;
            if (x1 < 0) continue;
            if (x1 > this.rect.w) break;

            this.ctx.moveTo(x1, 0);
            this.ctx.lineTo(x1, this.rect.h);
        }
        
        this.ctx.stroke();

        // 绘制内容
        let indexStart = Math.floor(this.rect.y / this.lineHeight) - 1;
        indexStart = Math.max(0, indexStart);

        let indexMax = indexStart + Math.floor(this.rect.h / this.lineHeight) + 2;
        indexMax = Math.min(this.option.list.length, indexMax);

        this.ctx.fillStyle = '#000';
        for (let index = indexStart; index < indexMax; index++) {
            let r = this.option.list[index];
            let x = 0;
            for (let k in this.option.column) {
                let col = this.option.column[k];
                let x1 = x - this.rect.x;
                this.drawText(x1, index, col, r[col.code]);
                x += col.width;
            }
        }

        // 绘制列头
        let colX = 0;
        for (let k in this.option.column) {
            let r = this.option.column[k];
            colX += r.width;
            if (k < this.option.fixColumn && this.rect.x > 0)
            {
                continue;
            }
            let x1 = colX - r.width - this.rect.x;
            this.ctx.fillStyle = '#ddd';
            this.ctx.fillRect(x1, 0, r.width, this.lineHeight);
            this.ctx.strokeRect(x1, 0, r.width, this.lineHeight);
            this.drawColText(x1, r);
        }

        colX = colX - this.rect.x;
        if (colX < this.rect.w) {
            this.ctx.fillStyle = '#ddd';
            this.ctx.fillRect(colX, 0, this.rect.w - colX, this.lineHeight);
            this.ctx.strokeRect(colX, 0, this.rect.w - colX, this.lineHeight);
        }

        // 绘制固定列
        if (this.rect.x > 0)
        {
            this.drawFixColumn();
        }

        // 绘制参考点 
        this.ctx.fillStyle = '#00f';
        for (let r of this.pointList) {
            this.ctx.beginPath();
            this.ctx.arc(r.x - this.rect.x, r.y - this.rect.y, 5, 0, 2 * Math.PI);
            this.ctx.fill();
        }
    }
     
    // 固定前N列
    drawFixColumn()
    {
        // 清空
        let maxCount = Math.min(this.option.fixColumn, this.option.column.length);
        let colX = 0;
        
        for (let k=0; k<maxCount; k++)
        {
            let col = this.option.column[k];
            colX += col.width;
        }

        this.ctx.clearRect(0, this.lineHeight, colX, this.rect.h);
    
        // 画网格线
        this.ctx.lineWidth = 1;
        this.ctx.strokeStyle = this.option.borderColor;
        this.ctx.beginPath();

        let yStart = (-this.rect.y) % this.lineHeight;
        for (let y = yStart; y < this.rect.h; y += this.lineHeight) {
            this.ctx.moveTo(0, y);
            this.ctx.lineTo(colX, y);
        }

        colX = 0;
        for (let k=0; k<maxCount; k++)
        {
            let col = this.option.column[k];
            colX += col.width;
            this.ctx.moveTo(colX, 0);
            this.ctx.lineTo(colX, this.rect.h);
        }
        
        this.ctx.stroke();
        
        // 绘制内容
        let indexStart = Math.floor(this.rect.y / this.lineHeight) - 1;
        indexStart = Math.max(0, indexStart);

        let indexMax = indexStart + Math.floor(this.rect.h / this.lineHeight) + 2;
        indexMax = Math.min(this.option.list.length, indexMax);

        this.ctx.fillStyle = '#000';
        for (let index = indexStart; index < indexMax; index++) {

            let r = this.option.list[index];
            colX = 0;
            for (let k=0; k<maxCount; k++) {
                if (k >= maxCount) break;
                let col = this.option.column[k];
                this.drawText(colX, index, col, r[col.code]);
                colX += col.width;
            }
        }

        // 画表头
        colX = 0;
        for (let k=0; k<maxCount; k++) {
            let r = this.option.column[k];
            this.ctx.fillStyle = '#ddd';
            this.ctx.fillRect(colX, 0, r.width, this.lineHeight);
            this.ctx.strokeRect(colX, 0, r.width, this.lineHeight);
            this.drawColText(colX, r);
            colX += r.width;
        }

        // 画隔离线
        this.ctx.strokeStyle = '#00f';
        this.ctx.beginPath();
        this.ctx.moveTo(colX, 0);
        this.ctx.lineTo(colX, this.rect.h);
        this.ctx.stroke();
    }
    
    // 绘制列头文字
    drawColText(x, col)
    {
        let drawY = this.fontOffsetH;
        let align = col.align || 'center';
        this.ctx.textAlign = align;

        this.ctx.fillStyle = '#000';
        switch (align)
        {
            case 'left':
                this.ctx.fillText(col.name, x + this.option.paddingX * ZFixTable.DPI, drawY);
                break;
            case 'right':
                this.ctx.fillText(col.name, x + col.width - this.option.paddingX * ZFixTable.DPI, drawY);
                break;
            default:
                this.ctx.fillText(col.name, x + col.width / 2, drawY, col.width);
        }
    }

    // 绘制内容文字
    drawText(x, rowIndex, col, val)
    {
        if (col.type == 'progress' || col.type == 'bar')
        {
            this.drawProgress(x, rowIndex, col, val);
            return;
        }

        if (col.type == 'op' || col.type == 'btn')
        {
            this.drawBtn(x, rowIndex, col);
            return;
        }

        if (typeof(val) == 'undefined') return;

        let drawY = -this.rect.y + rowIndex * this.lineHeight + this.lineHeight + this.fontOffsetH;
        if (drawY < -this.lineHeight || drawY > this.rect.h) {
            return;
        }

        let align = col.align || 'center';
        this.ctx.textAlign = align;

        let _color = col.color || '#000';
        if (typeof(_color) == 'function')
        {
            _color = _color(this.option.list[rowIndex]);
        }

        this.ctx.fillStyle = _color;
        
        let _format = col.format;
        if (typeof(_format) == 'function')
        {
            _format = _format(this.option.list[rowIndex]);
        }
        else if (_format)
        {
            val = _format.replace('{0}', val);
        }

        switch (align)
        {
            case 'left':
                this.ctx.fillText(val, x + this.option.paddingX * ZFixTable.DPI, drawY);
                break;
            case 'right':
                this.ctx.fillText(val, x + col.width - this.option.paddingX * ZFixTable.DPI, drawY);
                break;
            default:
                this.ctx.fillText(val, x + col.width / 2,  drawY, col.width);
        }
    }
    
    // 绘制进度条
    drawProgress(x, rowIndex, col, val)
    {
        let per = val / (col.max||100);
        let w = col.width - this.option.paddingX * 2 * ZFixTable.DPI;
        let h = this.lineHeight / 2;

        let y = -this.rect.y + rowIndex * this.lineHeight + this.lineHeight + this.lineHeight / 4;

        this.ctx.fillStyle = '#ddd';
        this.ctx.fillRect(x + this.option.paddingX * ZFixTable.DPI, y, w, h);

        let color = col.color || '#66f,#6f6';
        let colorArr = color.split(',');
        if (colorArr.length > 1)
        {
            let grd = this.ctx.createLinearGradient(x,y,x+w,y);
            for (let k in colorArr)
            {
                grd.addColorStop(k, colorArr[k]);
            }
            color = grd;
        }
        this.ctx.fillStyle = color;
        this.ctx.fillRect(x + this.option.paddingX * ZFixTable.DPI, y, w * per, h);
    }
    
    // 绘制操作按钮
    drawBtn(x, rowIndex, col)
    {
        if (!col.btnList) return;

        let y = -this.rect.y + rowIndex * this.lineHeight + this.lineHeight + this.option.paddingY * 0.8 * ZFixTable.DPI;
        let h = this.lineHeight - this.option.paddingY * 1.4 * ZFixTable.DPI;
        
        this.ctx.font = Math.round(this.fontSize.h * 0.8 * ZFixTable.DPI) + 'px ' + this.option.font;
        let fontY = -this.rect.y + rowIndex * this.lineHeight + this.lineHeight + this.fontOffsetH;
        
        x += this.option.paddingX * ZFixTable.DPI;
        for (let k in col.btnList)
        {
            let str = col.btnList[k];
            let w = this.ctx.measureText(str).width + 10;
            this.roundRect(this.ctx, x, y, w, h, 5);
            
            this.ctx.strokeStyle = this.option.borderColor;
            this.ctx.fillStyle = 'rgba(0,0,0,0.1)';
            this.ctx.fill();
            this.ctx.stroke();
            
            this.ctx.fillStyle = '#000';
            this.ctx.fillText(str, x + w / 2,  fontY);

            this.btnList.push({
                rect:{x:x, y:y, w:w, h:h},
                name:str,
                data:this.option.list[rowIndex],
            });

            x += w + this.option.paddingX / 2 * ZFixTable.DPI;
        }

        this.ctx.font = Math.round(this.fontSize.h * ZFixTable.DPI) + 'px ' + this.option.font;
    }
    
    // 圆角矩形
    roundRect(ctx, x, y, width, height, radius)
    {
        ctx.beginPath();
        ctx.arc(x + radius, y + radius, radius, Math.PI, Math.PI * 3 / 2);   
        ctx.lineTo(width - radius + x, y);   
        ctx.arc(width - radius + x, radius + y, radius, Math.PI * 3 / 2, Math.PI * 2);   
        ctx.lineTo(width + x, height + y - radius);   
        ctx.arc(width - radius + x, height - radius + y, radius, 0, Math.PI * 1 / 2);   
        ctx.lineTo(radius + x, height +y);   
        ctx.arc(radius + x, height - radius + y, radius, Math.PI * 1 / 2, Math.PI);   
        ctx.closePath();   
    }

    // 检测鼠标是否移动到按钮上
    checkBtn(x,y)
    {
        x -= this.rect.x;
        y -= this.rect.y;

        this.hoverBtn = null;
        if (y < this.lineHeight) return;
        
        for (let k in this.btnList)
        {
            let r = this.btnList[k];
            if (x >= r.rect.x && x <= r.rect.x + r.rect.w && y >= r.rect.y && y <= r.rect.y + r.rect.h)
            {
                this.hoverBtn = r;
                break;
            }
        }
    }
}