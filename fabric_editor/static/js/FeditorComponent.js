/////// 自定义组件
Feditor.createComponent = function () {
    // 文本框
    fabric.TextRect = fabric.util.createClass(fabric.Rect, {
        type: 'TextRect',
        initialize: function (options) {
            options || (options = {});
            options.width = options.width || 100;
            options.height = options.height || 30;
            options.zfill = options.zfill || '#BBF';
            options.stroke = options.stroke || '#000';
            options.strokeWidth = options.strokeWidth ?? 1;
            options.stroke = options.stroke || '#000';
            this.callSuper('initialize', options);
            this.set('text', options.text || '中文A123');
            this.set('textFill', options.textFill || '#000');
            this.set('fontFamily', options.fontFamily || 'Helvetica');
            if (options.zfill){
                this.fill = Feditor.parseFillColor(options.zfill);
            }
        },
        toObject: function () {
            return fabric.util.object.extend(this.callSuper('toObject'), {
                _zid: this.get('_zid'),
                _zbind: this.get('_zbind'),
                lock: this.get('lock'),
                zfill: this.get('zfill'),
                text: this.get('text'),
                textFill: this.get('textFill'),
                fontFamily: this.get('fontFamily'),
            });
        },
        _render: function (ctx) {
            this.callSuper('_render', ctx);
            ctx.font = (this.height * 0.7) + 'px ' + this.fontFamily;
            ctx.fillStyle = this.textFill;
            ctx.textAlign = "center";
            ctx.textBaseline = "middle";
            ctx.fillText(this.text, 0, this.height * 0.05);
        }
    });

    fabric.TextRect.fromObject = function (object, callback) {
        return fabric.Object._fromObject('TextRect', object, callback);
    };

    // 管道
    fabric.Pipe = fabric.util.createClass(fabric.Group, {
        type: 'Pipe',
        initialize: function (options) {
            options || (options = {});

            options.pipeBackColor = options.pipeBackColor || '#000';
            options.pipeColor = options.pipeColor || '#0F0';
            options.pipeWidth = options.pipeWidth || 15;
            options.pipeOpacity = options.pipeOpacity || 1;
            options.hasControls = false;
            options.objectCaching = false;
            options.perPixelTargetFind = true;
            options.targetFindTolerance = 4;

            fabric.Object.prototype.padding = 0;
            fabric.Object.prototype.transparentCorners = false;

            options.list = options.list || [
                { x: 0, y: 0 },
                { x: 200, y: 100 },
                { x: 200, y: 200 },
            ];

            let item1 = new fabric.Polyline(options.list, {
                top: 0,
                left: 0,
                fill: 'transparent',
                stroke: options.pipeBackColor,
                strokeWidth: options.pipeWidth,
                strokeLineCap: 'round',
                strokeLineJoin: 'round',
                objectCaching: false,
            });
            let item2 = new fabric.Polyline(options.list, {
                top: options.pipeWidth * 0.2,
                left: options.pipeWidth * 0.2,
                fill: 'transparent',
                stroke: options.pipeColor,
                strokeWidth: options.pipeWidth * 0.6,
                strokeLineCap: 'round',
                strokeLineJoin: 'round',
                strokeDashArray: [options.pipeWidth * 1.2, options.pipeWidth],
                strokeDashOffset: 0,
                opacity: options.pipeOpacity,
                objectCaching: false,
            });

            this.callSuper('initialize', [item1, item2], options);
            this.set('pipeBackColor', options.pipeBackColor);
            this.set('pipeColor', options.pipeColor);
            this.set('pipeWidth', options.pipeWidth);
            this.set('pipeOpacity', options.pipeOpacity);
            this.set('list', options.list);
            if (options.zfill){
                this.fill = Feditor.parseFillColor(options.zfill);
            }
        },
        toObject: function () {
            return fabric.util.object.extend(this.callSuper('toObject'), {
                _zid: this.get('_zid'),
                _zbind: this.get('_zbind'),
                lock: this.get('lock'),
                pipeBackColor: this.get('pipeBackColor'),
                pipeColor: this.get('pipeColor'),
                pipeWidth: this.get('pipeWidth'),
                pipeOpacity: this.get('pipeOpacity'),
                list: this.get('list'),
            });
        },
        _updateAttr() {
            this._objects[0].set({
                stroke: this.pipeBackColor,
                strokeWidth: this.pipeWidth,
            });
            this._objects[1].set({
                top: this._objects[0].top + this.pipeWidth * 0.2,
                left: this._objects[0].left + this.pipeWidth * 0.2,
                stroke: this.pipeColor,
                strokeWidth: this.pipeWidth * 0.6,
                strokeDashArray: [this.pipeWidth * 1.2, this.pipeWidth],
                opacity: this.pipeOpacity,
            });
            this._objects[0].setCoords();
            this._objects[1].setCoords();
            this.setCoords();
        },
        _render: function (ctx) {
            this.callSuper('_render', ctx);
        }
    });

    fabric.Pipe.fromObject = function (object, callback) {
        return fabric.Object._fromObject('Pipe', object, callback);
    };

    // 条形刻度指针
    fabric.RectRule = fabric.util.createClass(fabric.Rect, {
        type: 'RectRule',
        initialize: function(options) {
            options || (options = { });
            this.callSuper('initialize', options);
            this.set('width', options.width || 200);
            this.set('height', options.height || 20);
            this.set('fill', options.fill || 'transparent');
            this.set('stroke', options.stroke || '#000');
            this.set('strokeWidth', 0);

            this.set('val', options.val || 25);
            this.set('min', options.min || 0);
            this.set('max', options.max || 100);
            this.set('step', options.step || 10);
            this.set('handColor', options.handColor || '#00F');
            if (this.zfill){
                this.fill = Feditor.parseFillColor(this.zfill);
            }
        },
        toObject: function() {
            return fabric.util.object.extend(this.callSuper('toObject'), {
                _zid: this.get('_zid'),
                _zbind: this.get('_zbind'),
                lock: this.get('lock'),
                zfill: this.get('zfill'),
                val: this.get('val'),
                min: this.get('min'),
                max: this.get('max'),
                step: this.get('step'),
                handColor: this.get('handColor'),
            });
        },
        _render: function(ctx) {
            this.callSuper('_render', ctx);

            ctx.strokeStyle = this.stroke;
            ctx.lineWidth = 0.5;

            let x = -this.width/2;
            let h = this.height/3;
            
            ctx.beginPath();
            for (let i=this.min; i<=this.max; i+=this.step)
            {
                let x1 = (i - this.min) / (this.max - this.min) * this.width;
                ctx.moveTo(x+x1, this.height/2);
                ctx.lineTo(x+x1, this.height/2 - h);
            }
            
            ctx.moveTo(-this.width/2, this.height/2+0.5);
            ctx.lineTo(-this.width/2, this.height/2 - h*1.5);
            ctx.moveTo(this.width/2, this.height/2+0.5);
            ctx.lineTo(this.width/2, this.height/2 - h*1.5);
            ctx.stroke();
            
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.moveTo(-this.width/2, this.height/2);
            ctx.lineTo(this.width/2,  this.height/2);
            ctx.stroke();

            let v = Feditor.limitNum(this.val);
            ctx.beginPath();
            x = -this.width/2 + (v - this.min) / (this.max - this.min) * this.width;
            let w = Math.max(this.height / 4, 5);
            ctx.moveTo(x, this.height/2);
            ctx.lineTo(x - w, -this.height/2);
            ctx.lineTo(x + w, -this.height/2);
            ctx.closePath();

            ctx.fillStyle = this.handColor;
            ctx.fill();
        }
    });
    
    fabric.RectRule.fromObject = function (object, callback) {
        return fabric.Object._fromObject('RectRule', object, callback);
    };

    // 实时监控曲线
    fabric.RealMonitor = fabric.util.createClass(fabric.Rect, {
        type: 'RealMonitor',
        initialize: function(options) {
            options || (options = { });

            this.callSuper('initialize', options);
            this.set('width', options.width || 200);
            this.set('height', options.height || 100);
            this.set('zfill', options.zfill || 'transparent');
            
            this.set('min', options.min || 0);
            this.set('max', options.max || 100);
            this.set('color', options.color || '#00F');
            this.set('list', []);
            if (this.zfill){
                this.fill = Feditor.parseFillColor(this.zfill);
            }
        },
        toObject: function() {
            return fabric.util.object.extend(this.callSuper('toObject'), {
                _zid: this.get('_zid'),
                _zbind: this.get('_zbind'),
                lock: this.get('lock'),
                zfill: this.get('zfill'),
                color: this.get('color'),
                min: this.get('min'),
                max: this.get('max'),
            });
        },
        setVal: function(val){
            this.list.push(val);
            if (this.list.length > this.width){
                this.list.shift();
            }
            this.dirty = true;
            Feditor.canvas.requestRenderAll();
        },
        setList: function(list){
            this.list = list;
            this.dirty = true;
            Feditor.canvas.requestRenderAll();
        },
        _render: function(ctx) {
            this.callSuper('_render', ctx);

            ctx.lineWidth = 1;
            ctx.strokeStyle = '#000';
            ctx.beginPath();
            ctx.moveTo(-this.width/2, this.height/2);
            ctx.lineTo(this.width/2,  this.height/2);
            ctx.stroke();

            if (this.list.length < 2)
            {
                return;
            }

            ctx.beginPath();
            ctx.moveTo(this.width/2, this.height/2);
            let plist = [];
            let pLast = null;
            let x = 0;
            for (let i=this.list.length-1; i>=0 && i<=this.width; i--)
            {
                let v = (this.list[i] - this.min) / (this.max - this.min) * this.height;
                v = Math.min(this.height, v);
                v = Math.max(0, v);
                pLast = {
                    x:this.width/2-(x++),
                    y:this.height/2-v,
                };
                plist.push(pLast);
                ctx.lineTo(pLast.x, pLast.y);
                ctx.lineTo(pLast.x-1, pLast.y);
            }

            ctx.lineTo(pLast.x-1, this.height/2);
            ctx.closePath();

            ctx.fillStyle = this.color;
            ctx.fill();
        }
    });
    
    fabric.RealMonitor.fromObject = function (object, callback) {
        return fabric.Object._fromObject('RealMonitor', object, callback);
    };
    
    // 自由下落组件
    fabric.Rain = fabric.util.createClass(fabric.Rect, {
        type: 'Rain',
        initialize: function(options) {
            options || (options = { });
            this.callSuper('initialize', options);
            this.set('width', options.width || 200);
            this.set('height', options.height || 200);
            this.set('zfill', options.zfill || 'transparent');
            this.set('stroke', options.stroke || '#000');
            this.set('strokeWidth', options.strokeWidth || 0);

            this.set('ballType', options.ballType || 'circle');
            this.set('ballSize', options.ballSize || 100);
            this.set('speed', options.speed || 1);
            this.set('color', options.color || '#000');
            this.set('isPlay', true);
            this.set('list', []);
            if (this.zfill){
                this.fill = Feditor.parseFillColor(this.zfill);
            }

            this.play();
        },
        toObject: function() {
            return fabric.util.object.extend(this.callSuper('toObject'), {
                _zid: this.get('_zid'),
                _zbind: this.get('_zbind'),
                lock: this.get('lock'),
                zfill: this.get('zfill'),
                ballType: this.get('ballType'),
                ballSize: this.get('ballSize'),
                speed: this.get('speed'),
                color: this.get('color'),
            });
        },
        _render: function(ctx) {
            this.callSuper('_render', ctx);

            ctx.fillStyle = this.color;
            for (let ball of this.list)
            {
                let deg = ball.deg * Math.PI / 180;
                ctx.globalAlpha = (1 - (ball.y + this.height/2) / this.height) * ball.alpha;
                ctx.rotate(deg);
                ctx.beginPath();
                if (this.ballType == 'circle')
                {
                    ctx.arc(ball.x,ball.y,ball.r,0,2*Math.PI);
                    ctx.fill();
                }
                else if (this.ballType == 'rect')
                {
                    ctx.fillRect(ball.x-ball.r,ball.y-ball.r,ball.r*2,ball.r*2);
                }
                ctx.rotate(-deg);
            }
        },
        play:function(){
            if (this._isDel) return;
            if (this.isPlay && this.speed > 0)
            {
                for (let i=0; i<=this.speed; i++){
                    this.list.push(this.createBall());
                }

                let newList = [];
                for (let ball of this.list)
                {
                    ball.y += this.speed * ball.speedRate;
                    ball.speedRate *= 1.01;
                    if (ball.y < this.height/2-ball.r)
                    {
                        newList.push(ball);
                    }
                }
                this.list = newList;

                this.dirty = true;
                Feditor.canvas.requestRenderAll();
            }
            let _this = this;
            window.requestAnimationFrame(function(){_this.play();});
            //window.setTimeout(function(){_this.play();}, 20);
        },
        createBall:function(){
            let padding = this.width / 10 / 2 * (this.ballSize / 100);
            let item = {
                r:padding * (1-0.3*Math.random()),
                x:fabric.util.getRandomInt(-this.width/2 + padding, this.width/2 - padding),
                y:-this.height/2 + padding,
                speedRate:0.5 + Math.random() * 0.2,
                deg:10 * Math.random() - 5,
                alpha:0.7 + 0.3 * Math.random(),
            };

            return item;
        },
    });
    
    fabric.Rain.fromObject = function (object, callback) {
        return fabric.Object._fromObject('Rain', object, callback);
    };

    // 进度条组件
    fabric.Progress = fabric.util.createClass(fabric.Rect, {
        type: 'Progress',
        initialize: function(options) {
            options || (options = { });
            this.callSuper('initialize', options);
            this.set('width', options.width || 200);
            this.set('height', options.height || 30);
            this.set('zfill', options.zfill || 'transparent');
            this.set('stroke', options.stroke || '#000');
            this.set('strokeWidth', options.strokeWidth || 1);

            this.set('split', options.split ?? 0);
            this.set('max', options.max ?? 100);
            this.set('val', options.val ?? 25);
            this.set('color', options.color || '#00F');
            if (this.zfill){
                this.fill = Feditor.parseFillColor(this.zfill);
            }
        },
        toObject: function() {
            return fabric.util.object.extend(this.callSuper('toObject'), {
                _zid: this.get('_zid'),
                _zbind: this.get('_zbind'),
                lock: this.get('lock'),
                zfill: this.get('zfill'),
                split: this.get('split'),
                val: this.get('val'),
                color: this.get('color'),
            });
        },
        _render: function(ctx) {
            this.callSuper('_render', ctx);

            let v = Feditor.limitNum(this.val, 0, this.max);
            ctx.fillStyle = this.color;
            let h1 = this.strokeWidth / 2;
            let w = this.width * (v / this.max);
            w = Math.round(w);
            ctx.beginPath();
            ctx.fillRect(-this.width/2,-this.height/2+h1,w,this.height-2*h1);

            if (this.split < 2)
            {
                return;
            }

            let s1 = 2;
            let w1 = (this.width - (this.split - 1) * s1) / this.split;
            let x = -this.width/2;
            for (let i=1; i<this.split; i++)
            {
                x += w1;
                if (this.fill == 'transparent')
                {
                    ctx.clearRect(x,-this.height/2+h1,s1,this.height-2*h1);
                }
                else
                {
                    ctx.fillStyle = this.fill;
                    ctx.fillRect(x,-this.height/2+h1, s1, this.height-2*h1);
                }

                x += s1;
            }
        },
    });
    
    fabric.Progress.fromObject = function (object, callback) {
        return fabric.Object._fromObject('Progress', object, callback);
    };
    
    // 仪表盘组件
    fabric.Gauge = fabric.util.createClass(fabric.Rect, {
        type: 'Gauge',
        initialize: function(options) {
            options || (options = { });
            this.callSuper('initialize', options);
            this.set('width', options.width || 200);
            this.set('height', options.height || 150);
            this.set('zfill', options.zfill || 'transparent');
            this.set('stroke', options.stroke || '#000');
            this.set('strokeWidth', options.strokeWidth || 0);

            this.set('min', options.min || 0);
            this.set('max', options.max || 100);
            this.set('val', options.val || 25);
            this.set('color', options.color || '#00F');
            this.set('back_color', options.back_color || '#ccc');
            this.set('pointer_color', options.pointer_color || '#00F');
            this.set('pointer_len', options.pointer_len ?? 0.9);
            this.set('line_size', options.line_size ?? 0.1);
            this.set('led', options.led ?? 0);
            this.set('split_count', options.split_count ?? 20);
            this.set('split_color', options.split_color || '#000');
            this.set('unit', options.unit || '');
            this.set('show_name', options.show_name || '仪表盘');
            this.set('pointer_type', options.pointer_type || 1);
            this.set('range_list', options.range_list || '');
            if (this.zfill){
                this.fill = Feditor.parseFillColor(this.zfill);
            }
        },
        toObject: function() {
            return fabric.util.object.extend(this.callSuper('toObject'), {
                _zid: this.get('_zid'),
                _zbind: this.get('_zbind'),
                lock: this.get('lock'),
                zfill: this.get('zfill'),
                min: this.get('min'),
                max: this.get('max'),
                val: this.get('val'),
                color: this.get('color'),
                back_color: this.get('back_color'),
                pointer_color: this.get('pointer_color'),
                pointer_len: this.get('pointer_len'),
                line_size: this.get('line_size'),
                led: this.get('led'),
                split_count: this.get('split_count'),
                split_color: this.get('split_color'),
                unit: this.get('unit'),
                show_name: this.get('show_name'),
                pointer_type: this.get('pointer_type'),
                range_list: this.get('range_list'),
            });
        },
        _render: function(ctx) {
            this.callSuper('_render', ctx);
            Feditor.ctx = ctx;

            let center = new ZPoint(0, this.height/6);
            let radius = Math.min(this.width/2, this.height/2) * 1.1;
    
            let option = {};
            option.size = radius * this.line_size;
            option.color = this.color;
            option.back_color = this.back_color;
            option._pointer = this.pointer_color;
            option.pointer_len = this.pointer_len;
            option.min = this.min;
            option.max = this.max;
            option.val = Feditor.limitNum(this.val, this.min, this.max);
            option.led = this.led;
            option.split_count = this.split_count;
            option.split_color = this.split_color;
            option.unit = this.unit;
            option.show_name = this.show_name;
            option.pointer_type = this.pointer_type;
            option.range_list = null;
            if (this.range_list)
            {
                let strs = this.range_list.split(',');
                if (strs.length % 3 == 0)
                {
                    option.range_list = strs;
                }
            }
    
            let degBegin = -200, degEnd = 20;
            let getDeg = function(val){
                let deg = (val - option.min) / (option.max - option.min);
                deg = degBegin + deg * (degEnd - degBegin);
                deg = Math.max(deg, degBegin);
                deg = Math.min(deg, degEnd);
    
                return deg;
            };
            
            let deg = getDeg(option.val);
    
            // 画圆弧
            if (option.led)
            {
                let ledStep = (degEnd - degBegin) / option.led;
                let d = degBegin - ledStep * 0.3;
                for (let i=0; i<=option.led; i++)
                {
                    if (d < deg)
                    {
                        Feditor.ctxArc(center, radius, d, d+ledStep*0.8).ctxStroke(option.color, option.size);
                    }
                    else
                    {
                        Feditor.ctxArc(center, radius, d, d+ledStep*0.8).ctxStroke(option.back_color, option.size);
                    }
    
                    d += ledStep;
                }
            }
            else if (option.range_list)
            {
                for (let i=0; i<option.range_list.length; i+=3)
                for (let k in option.range_list)
                {
                    let color = option.range_list[i];
                    Feditor.ctxArc(center, radius, getDeg(option.range_list[i+1]), getDeg(option.range_list[i+2])).ctxStroke(color, option.size);
                }
            }
            else
            {
                Feditor.ctxArc(center, radius, degBegin, degEnd).ctxStroke(option.back_color, option.size);
                Feditor.ctxArc(center, radius, degBegin, deg).ctxStroke(option.color, option.size);
            }
    
            // 画刻度
            if (option.split_count)
            {
                option.split_color = option.split_color || '#000';
                let splitCount = option.split_count;
                let degStep = (degEnd - degBegin) / splitCount;
                let d = degBegin;
                for (let i=0; i<=splitCount; i++)
                {
                    if (i%5 == 0)
                    {
                        Feditor.ctxArc(center, radius-option.size/2-3, d-0.5, d+0.5).ctxStroke(option.split_color, radius*0.08);
                    }
                    else
                    {
                        Feditor.ctxArc(center, radius-option.size/2-3+0.1, d-0.3, d+0.3).ctxStroke(option.split_color, radius*0.03);
                    }
                    d += degStep;
                }
            }
    
            // 画值
            let fontSize = Math.round(radius * 0.35);
            let fontColor = option.split_color;
            let strVal = this.val + (option.unit||'');
            Feditor.ctxText(center.goDeg(90, radius*0.35), strVal, 'center', 'bold ' + fontSize + 'px Arial').ctxFillText(fontColor);
            if (option.show_name)
            {
                fontSize = Math.round(radius * 0.2);
                Feditor.ctxText(center.goDeg(-90, radius*0.5), option.show_name, 'center', fontSize + 'px Arial').ctxFillText(fontColor);
            }
    
            // 画指针
            ctx.globalAlpha = 0.8;
            let pList = [];
            switch (option.pointer_type || 1)
            {
                case 1:
                    pList.push(center.goDeg(deg-90, radius * 0.05));
                    pList.push(center.goDeg(deg+90, radius * 0.05));
                    pList.push(center.goDeg(deg, radius * option.pointer_len));
                    Feditor.ctxArea(pList).ctxStroke('#fff', 2).ctxFill(option._pointer);
                    Feditor.ctxLine(center.goDeg(deg-180, radius * 0.15), center).ctxStroke(option._pointer, radius * 0.05);
                    break;
                case 2:
                    Feditor.ctxLine(center.goDeg(deg-180, radius * 0.15), center.goDeg(deg, radius * (option.pointer_len-0.1))).ctxStroke(option._pointer, radius * 0.03);
                    break;
                case 3:
                    pList.push(center.goDeg(deg-180, radius * 0.15));
                    pList.push(center.goDeg(deg-90, radius * 0.05));
                    pList.push(center.goDeg(deg, radius * option.pointer_len));
                    pList.push(center.goDeg(deg+90, radius * 0.05));
                    Feditor.ctxArea(pList).ctxStroke('#fff', 2).ctxFill(option._pointer);
                    break;
            }
    
            Feditor.ctxCircle(center, radius * 0.08).ctxFill(option._pointer);
            Feditor.ctxCircle(center, radius * 0.03).ctxFill('#fff');
            ctx.globalAlpha = 1;
        },
    });
    
    fabric.Gauge.fromObject = function (object, callback) {
        return fabric.Object._fromObject('Gauge', object, callback);
    };
    
    // 开关组件
    fabric.Switch = fabric.util.createClass(fabric.Group, {
        type: 'Switch',
        initialize: function (options) {
            options || (options = { });
            this.set('val', options.val ?? 0);
            this.set('enabled', options.enabled ?? 1);
            this.set('width', 91);
            this.set('height', 51);
            let list = [
                new fabric.Rect({top:0, left:0, width:90, height:50, rx:25, ry:25, fill:'#ddd', stroke:'#000', strokeWidth:1}),
                new fabric.Text('开', {top: 27, left: 25, fontSize:25, lineHeight:1, fontWeight:'bold', fill:'#0A0', originX:'center', originY:'center',}),
                new fabric.Text('关', {top: 27, left: 65, fontSize:25, lineHeight:1, fontWeight:'bold', fill:'#666', originX:'center', originY:'center',}),
                new fabric.Circle({top:26, left:25, radius: 20, fill:'#666', originX:'center', originY:'center',}),
                new fabric.Rect({top:0, left:0, width:90, height:50, rx:25, ry:25, fill:'#000', stroke:'#000', strokeWidth:1, opacity:0.3, visible:false}),
            ];
            this.callSuper('initialize', list, options);
            this._updateAttr();
            
            let _this = this;
            this.on('mousedown', function(e){
                let obj = _this;
                if (obj.enabled == 0) return;
                if (Feditor.isEditor && !e.e.altKey) return;
                obj.val = obj.val == 1 ? 0 : 1;
                obj._updateAttr();
                obj.dirty = true;
                Feditor.canvas.requestRenderAll();
            });
        },
        toObject: function() {
            return fabric.util.object.extend(this.callSuper('toObject'), {
                _zid: this.get('_zid'),
                _zbind: this.get('_zbind'),
                lock: this.get('lock'),
                val: this.get('val'),
                enabled: this.get('enabled'),
            });
        },
        _updateAttr:function(){
            this._objects[4].visible = this.enabled == 0;
            this.hoverCursor = this.enabled == 1 ? 'pointer' : 'default';
            let r = this._objects[3].radius;
            if (this.val == 0)
            {
                let gradient = new fabric.Gradient({
                    type: 'radial',
                    coords: {
                        r1: r, r2: 0, x1: r, y1: r, x2: r, y2: r/2,
                    },
                    colorStops: [
                        { offset: 0, color: '#666' },
                        { offset: 1, color: '#999' }
                    ]
                });
                this._objects[3].left = 25-this.width/2;
                this._objects[3].fill = gradient;
                this._objects[0].fill = '#ddd';
            }
            else
            {
                let gradient = new fabric.Gradient({
                    type: 'radial',
                    coords: {
                        r1: r, r2: 0, x1: r, y1: r, x2: r, y2: r/2,
                    },
                    colorStops: [
                        { offset: 0, color: '#0A0' },
                        { offset: 1, color: '#0F0' }
                    ]
                });
                this._objects[3].left = 65-this.width/2;
                this._objects[3].fill = gradient;
                this._objects[0].fill = '#CFC';
            }
        },
        _render: function(ctx) {
            this.callSuper('_render', ctx);
        }
    });
    
    fabric.Switch.fromObject = function (object, callback) {
        return fabric.Object._fromObject('Switch', object, callback);
    };
    
    // 开关组件（竖向）
    fabric.SwitchY = fabric.util.createClass(fabric.Group, {
        type: 'SwitchY',
        initialize: function (options) {
            options || (options = { });
            this.set('val', options.val ?? 0);
            this.set('enabled', options.enabled ?? 1);
            this.set('width', 51);
            this.set('height', 91);
            let list = [
                new fabric.Rect({top:0, left:0, width:50, height:90, rx:25, ry:25, fill:'#ddd', stroke:'#000', strokeWidth:1}),
                new fabric.Text('开', {top: 65, left: 25, fontSize:25, lineHeight:1, fontWeight:'bold', fill:'#0A0', originX:'center', originY:'center',}),
                new fabric.Text('关', {top: 25, left: 25, fontSize:25, lineHeight:1, fontWeight:'bold', fill:'#666', originX:'center', originY:'center',}),
                new fabric.Circle({top:65, left:25, radius: 20, fill:'#666', originX:'center', originY:'center',}),
                new fabric.Rect({top:0, left:0, width:50, height:90, rx:25, ry:25, fill:'#000', stroke:'#000', strokeWidth:1, opacity:0.3, visible:false}),
            ];
            this.callSuper('initialize', list, options);
            this._updateAttr();
            
            let _this = this;
            this.on('mousedown', function(e){
                let obj = _this;
                if (obj.enabled == 0) return;
                if (Feditor.isEditor && !e.e.altKey) return;
                obj.val = obj.val == 1 ? 0 : 1;
                obj._updateAttr();
                obj.dirty = true;
                Feditor.canvas.requestRenderAll();
            });
        },
        toObject: function() {
            return fabric.util.object.extend(this.callSuper('toObject'), {
                _zid: this.get('_zid'),
                _zbind: this.get('_zbind'),
                lock: this.get('lock'),
                val: this.get('val'),
                enabled: this.get('enabled'),
            });
        },
        _updateAttr:function(){
            this._objects[4].visible = this.enabled == 0;
            this.hoverCursor = this.enabled == 1 ? 'pointer' : 'default';
            let r = this._objects[3].radius;
            if (this.val == 0)
            {
                let gradient = new fabric.Gradient({
                    type: 'radial',
                    coords: {
                        r1: r, r2: 0, x1: r, y1: r, x2: r, y2: r/2,
                    },
                    colorStops: [
                        { offset: 0, color: '#666' },
                        { offset: 1, color: '#999' }
                    ]
                });
                this._objects[3].top = 65-this.height/2;
                this._objects[3].fill = gradient;
                this._objects[0].fill = '#ddd';
            }
            else
            {
                let gradient = new fabric.Gradient({
                    type: 'radial',
                    coords: {
                        r1: r, r2: 0, x1: r, y1: r, x2: r, y2: r/2,
                    },
                    colorStops: [
                        { offset: 0, color: '#0A0' },
                        { offset: 1, color: '#0F0' }
                    ]
                });
                this._objects[3].top = 25-this.height/2;
                this._objects[3].fill = gradient;
                this._objects[0].fill = '#CFC';
            }
        },
        _render: function(ctx) {
            this.callSuper('_render', ctx);
        }
    });
    
    fabric.SwitchY.fromObject = function (object, callback) {
        return fabric.Object._fromObject('SwitchY', object, callback);
    };
    
    // 按钮
    fabric.Button = fabric.util.createClass(fabric.Rect, {
        type: 'Button',
        initialize: function (options) {
            options || (options = {});
            options.width = options.width || 80;
            options.height = options.height || 30;
            options.rx = options.rx ?? 5;
            options.ry = options.ry ?? 5;
            options.stroke = options.stroke ?? '#999';
            options.strokeWidth = options.strokeWidth ?? 1;
            options.zfill = options.zfill ?? '@linear|0,0,0,1|0/#fff/75/#CCCCCC/100/#FFFFFF';
            this.callSuper('initialize', options);
            this.set('text', options.text || '按钮');
            this.set('textFill', options.textFill || '#000');
            this.set('enabled', options.enabled ?? 1);
            
            if (options.zfill){
                this.fill = Feditor.parseFillColor(options.zfill);
            }
            
            this.hoverCursor = this.enabled == 1 ? 'pointer' : 'default';
        
            let _this = this;
            this.on('mouseover', function () {
                if (_this.enabled != 1) return;
                _this.stroke = '#333';
                _this.dirty = true;
                Feditor.canvas.requestRenderAll();
            });
            this.on('mouseout', function () {
                if (_this.enabled != 1) return;
                _this.stroke = '#999';
                _this.dirty = true;
                Feditor.canvas.requestRenderAll();
            });
            this.on('mousedown', function (e) {
                if (_this.enabled == 0) return;
                if (Feditor.isEditor && !e.e.altKey) return;
                alert('click');
            });
        },
        toObject: function () {
            return fabric.util.object.extend(this.callSuper('toObject'), {
                _zid: this.get('_zid'),
                _zbind: this.get('_zbind'),
                lock: this.get('lock'),
                zfill: this.get('zfill'),
                text: this.get('text'),
                textFill: this.get('textFill'),
                enabled: this.get('enabled'),
            });
        },
        _render: function (ctx) {
            this.hoverCursor = this.enabled == 1 ? 'pointer' : 'default';
            this.callSuper('_render', ctx);
            ctx.globalAlpha = this.enabled == 1 ? 1 : 0.8;
            ctx.font = (this.height * 0.5) + 'px Helvetica';
            ctx.fillStyle = this.textFill;
            ctx.textAlign = "center";
            ctx.textBaseline = "middle";
            ctx.fillText(this.text, 0, this.height * 0.07);
        }
    });

    fabric.Button.fromObject = function (object, callback) {
        return fabric.Object._fromObject('Button', object, callback);
    };
    
    // 指示灯
    fabric.Light = fabric.util.createClass(fabric.Circle, {
        type: 'Light',
        initialize: function (options) {
            options || (options = {});
            
            options.radius = options.radius ?? 15;
            options.originX = options.originX ?? 'center';
            options.originY = options.originY ?? 'center';
            options.stroke = options.stroke ?? 'rgba(0,0,0,0.5)';
            options.strokeWidth = options.strokeWidth ?? 3;
            this.callSuper('initialize', options);
            this.set('enabled', options.enabled ?? 1);
            this.set('color', options.color ?? 0);
            this.set('val', options.val ?? 1);

            this._updateAttr();
        
            let _this = this;
            this.on('mousedown', function (e) {
                if (_this.enabled == 0) return;
                if (Feditor.isEditor && !e.e.altKey) return;
                this.val = this.val == 1 ? 0 : 1;
                _this.dirty = true;
                Feditor.canvas.requestRenderAll();
            });
        },
        toObject: function () {
            return fabric.util.object.extend(this.callSuper('toObject'), {
                _zid: this.get('_zid'),
                _zbind: this.get('_zbind'),
                lock: this.get('lock'),
                val: this.get('val'),
                color: this.get('color'),
                enabled: this.get('enabled'),
            });
        },
        _updateAttr() {
            let r = this.radius;
            if (this.val)
            {
                let color = 'hsl(' + this.color + ',100%,50%)';
                this.set('shadow', '0px 0px ' + (r*0.75) + 'px ' + color);

                let gradient = new fabric.Gradient({
                    type: 'radial',
                    coords: {
                        r1: r/1.5,
                        r2: 0,
                        x1: r,
                        y1: r,
                        x2: r,
                        y2: r/2,
                    },
                    colorStops: [
                        { offset: 0, color: 'hsl(' + this.color + ',100%,50%)' },
                        { offset: 1, color: 'hsl(' + this.color + ',100%,80%)' }
                    ]
                });
                this.fill = gradient;
            }
            else
            {
                this.shadow = '';
                let gradient = new fabric.Gradient({
                    type: 'radial',
                    coords: {
                        r1: r/1.5,
                        r2: 0,
                        x1: r,
                        y1: r,
                        x2: r,
                        y2: r/2,
                    },
                    colorStops: [
                        { offset: 0, color: 'hsl(' + this.color + ',30%,50%)' },
                        { offset: 1, color: 'hsl(' + this.color + ',30%,80%)' }
                    ]
                });
                this.fill = gradient;
            }

            this.hoverCursor = this.enabled == 1 ? 'pointer' : 'default';
        },

        _render: function (ctx) {
            this.callSuper('_render', ctx);
        },
    });

    fabric.Light.fromObject = function (object, callback) {
        return fabric.Object._fromObject('Light', object, callback);
    };
    
    // 数字输入框
    fabric.NumInput = fabric.util.createClass(fabric.Rect, {
        type: 'NumInput',
        initialize: function (options) {
            options || (options = {});
            options.width = options.width || 100;
            options.height = options.height || 30;
            options.zfill = options.zfill || '#fff';
            options.stroke = options.stroke || '#000';
            options.strokeWidth = options.strokeWidth ?? 1;
            
            this.callSuper('initialize', options);
            this.set('val', options.val || '0');
            this.set('textFill', options.textFill || '#000');
            this.set('inputInfo', options.inputInfo || '数字输入');
            this.set('numMin', options.numMin || 0);
            this.set('numMax', options.numMax || 10000);
            this.set('numStep', options.numStep || 1);
            this.set('numRatio', options.numRatio || 1);

            if (options.zfill){
                this.fill = Feditor.parseFillColor(options.zfill);
            }

            this.hoverCursor = 'pointer';
            this.isActive = false;
            
            let _this = this;
            this.on('mousedown', function (e) {
                if (Feditor.isEditor && !e.e.altKey) return;
                Feditor.showNumInputMsg(_this);
            });
        },
        toObject: function () {
            return fabric.util.object.extend(this.callSuper('toObject'), {
                _zid: this.get('_zid'),
                _zbind: this.get('_zbind'),
                lock: this.get('lock'),
                zfill: this.get('zfill'),
                val: this.get('val'),
                textFill: this.get('textFill'),
                inputInfo: this.get('inputInfo'),
                numMin: this.get('numMin'),
                numMax: this.get('numMax'),
                numStep: this.get('numStep'),
                numRatio: this.get('numRatio'),
            });
        },
        _render: function (ctx) {
            this.callSuper('_render', ctx);
            ctx.font = (this.height * 0.7) + 'px Helvetica';
            ctx.fillStyle = this.isActive ? '#E90088' : this.textFill;
            ctx.textAlign = "center";
            ctx.textBaseline = "middle";
            ctx.fillText(this.val, 0, this.height * 0.05);
        }
    });

    fabric.NumInput.fromObject = function (object, callback) {
        return fabric.Object._fromObject('NumInput', object, callback);
    };

    // 表格
    fabric.Table = fabric.util.createClass(fabric.Rect, {
        type: 'Table',
        initialize: function (options) {
            options || (options = {});
            options.width = options.width || 300;
            options.height = options.height || 200;
            options.stroke = options.stroke ?? '#999';
            options.strokeWidth = options.strokeWidth ?? 2;
            options.zfill = options.zfill ?? 'transparent';
            this.callSuper('initialize', options);
            this.set('colCount', options.colCount || 4);
            this.set('rowCount', options.rowCount || 6);
            this.set('colSize', options.colSize || '');
            
            if (options.zfill){
                this.fill = Feditor.parseFillColor(options.zfill);
            }
        },
        toObject: function () {
            return fabric.util.object.extend(this.callSuper('toObject'), {
                _zid: this.get('_zid'),
                _zbind: this.get('_zbind'),
                lock: this.get('lock'),
                zfill: this.get('zfill'),
                colCount: this.get('colCount'),
                rowCount: this.get('rowCount'),
                colSize: this.get('colSize'),
            });
        },
        _render: function (ctx) {
            this.callSuper('_render', ctx);
            if (this.strokeWidth == 0) return;
            if (this.rowCount <= 0 || this.colCount <= 0) return;
            Feditor.ctx = ctx;
            let yStep = this.height / this.rowCount;
            for (let i=1; i<this.rowCount; i++)
            {
                let y = i * yStep - this.height/2;
                Feditor.ctxLine({x:-this.width/2, y:y}, {x:this.width/2, y:y}).ctxStroke(this.stroke, this.strokeWidth/2);
            }

            let colSize = this.colSize.trim();
            if (colSize == ''){
                let xStep = this.width / this.colCount;
                for (let i=1; i<this.colCount; i++)
                {
                    let x = i * xStep - this.width/2;
                    Feditor.ctxLine({x:x, y:-this.height/2}, {x:x, y:this.height/2}).ctxStroke(this.stroke, this.strokeWidth/2);
                }
            }else{
                let colList = [];
                let colSum = 0;
                for (let r of colSize.split(',')){
                    let s = r.trim();
                    if (s == '') continue;
                    let v = parseFloat(s);
                    if (v <= 0) continue;
                    colList.push(v);
                    colSum += v;
                }

                let x = 0;
                for (let i=0; i<colList.length-1; i++){
                    x += colList[i] / colSum * this.width;
                    Feditor.ctxLine({x:x-this.width/2, y:-this.height/2}, {x:x-this.width/2, y:this.height/2}).ctxStroke(this.stroke, this.strokeWidth/2);
                }
            }
        }
    });

    fabric.Table.fromObject = function (object, callback) {
        return fabric.Object._fromObject('Table', object, callback);
    };
    
    // 液体表面
    fabric.Liquid = fabric.util.createClass(fabric.Ellipse, {
        type: 'Liquid',
        initialize: function(options) {
            options || (options = { });
            this.callSuper('initialize', options);
            this.set('rx', options.rx || 200);
            this.set('ry', options.ry || 100);
            this.set('zfill', options.zfill || 'transparent');
            this.set('stroke', options.stroke || '#000');
            this.set('strokeWidth', options.strokeWidth || 0);

            this.set('ballSize', options.ballSize || 100);
            this.set('ballCount', options.ballCount || 1000);
            this.set('color', options.color || '#000');
            this.set('isPlay', true);
            this.set('list', []);
            if (this.zfill){
                this.fill = Feditor.parseFillColor(this.zfill);
            }
            this._updateAttr();

            this.play();
        },
        toObject: function() {
            return fabric.util.object.extend(this.callSuper('toObject'), {
                _zid: this.get('_zid'),
                _zbind: this.get('_zbind'),
                lock: this.get('lock'),
                zfill: this.get('zfill'),
                ballSize: this.get('ballSize'),
                ballCount: this.get('ballCount'),
                color: this.get('color'),
            });
        },
        _render: function(ctx) {
            this.callSuper('_render', ctx);

            ctx.fillStyle = this.color;
            for (let ball of this.list)
            {
                ctx.globalAlpha = ball.alpha;
                ctx.beginPath();
                ctx.arc(ball.x,ball.y,ball.r,0,2*Math.PI);
                ctx.fill();
            }
        },
        _updateAttr() {
            this.list = [];
            for (let i=0; i<=this.ballCount; i++){
                this.list.push(this.createBall());
            }
        },
        play:function(){
            if (this._isDel) return;
            if (this.isPlay)
            {
                for (let ball of this.list)
                {
                    if (ball.bo){
                        ball.alpha += ball.speedRate;
                        if (ball.alpha>0.5){
                            ball.alpha = 0.5;
                            ball.bo = false;
                        }
                    }else{
                        ball.alpha -= ball.speedRate;
                        if (ball.alpha<0){
                            ball.alpha = 0;
                            ball.bo = true;
                        }
                    }

                    ball.x += Math.random() * 0.5 - 0.25;
                    ball.y += Math.random() * 0.5 - 0.25;
                    ball.x = Math.max(ball.x, ball.p.x - ball.r*2);
                    ball.x = Math.min(ball.x, ball.p.x + ball.r*2);
                    ball.y = Math.max(ball.y, ball.p.y - ball.r*2);
                    ball.y = Math.min(ball.y, ball.p.y + ball.r*2);
                }
                
                this.dirty = true;
                Feditor.canvas.requestRenderAll();
            }
            let _this = this;
            window.requestAnimationFrame(function(){_this.play();});
            //window.setTimeout(function(){_this.play();}, 20);
        },
        createBall:function(){
            let padding = Math.min(this.rx, this.ry) / 10 * (this.ballSize / 100);
            let p = this.randPoint(this.rx, this.ry);
            let item = {
                r:padding * (1.2-0.4*Math.random()),
                x:p.x,
                y:p.y,
                p:p,
                speedRate:0.01 + Math.random() * 0.01,
                alpha:0.2 + 0.3 * Math.random(),
                bo: Math.random() < 0.5,
            };

            return item;
        },
        randPoint:function(rx, ry){
            let theta = Math.random() * 2 * Math.PI;
            let rx1 = Math.sqrt(Math.random()) * rx;
            let ry1 = Math.sqrt(Math.random()) * ry;
            if (Math.random() < 0.05){
                rx1 = Math.random() * rx / 2;
                ry1 = Math.random() * ry / 2;
            }
            
            return {
                x: Math.cos(theta) * rx1,
                y: Math.sin(theta) * ry1,
            };
        },
    });
    
    fabric.Liquid.fromObject = function (object, callback) {
        return fabric.Object._fromObject('Liquid', object, callback);
    };
    
    // 图片旋转
    fabric.ImgRotate = fabric.util.createClass(fabric.Rect, {
        type: 'ImgRotate',
        initialize: function(options) {
            options || (options = { });
            
            options.width = options.width || 100;
            options.height = options.height || 100;
            options.originX = 'center';
            options.originY = 'center';
            options.fill = 'transparent';

            this.callSuper('initialize', options);
            
            this.set('strokeWidth', options.strokeWidth || 0);
            this.set('imgUrl', options.imgUrl || '');
            this.set('speed', options.speed || 1);
            this.set('isPlay', true);
            this.set('deg', 0);

            let _this = this;
            if (this.imgUrl){
                let img = document.createElement("img");
                img.onload = function() {
                    _this._img = this;
                    _this.dirty = true;
                    
                    Feditor.canvas.requestRenderAll();
                }
                img.src = this.imgUrl;
            }

            this.play();
        },
        toObject: function() {
            return fabric.util.object.extend(this.callSuper('toObject'), {
                _zid: this.get('_zid'),
                _zbind: this.get('_zbind'),
                lock: this.get('lock'),
                imgUrl: this.get('imgUrl'),
                speed: this.get('speed'),
            });
        },
        _render: function(ctx) {
            let deg = this.deg * Math.PI / 180;
            ctx.rotate(deg);
            this.callSuper('_render', ctx);
            if (this._img){
                ctx.drawImage(this._img, -this.width/2, -this.height/2, this.width, this.height);
            }
        },
        play:function(){
            if (this._isDel) return;
            if (this.isPlay)
            {
                this.deg += this.speed;
                this.deg = this.deg % 360;
                
                this.dirty = true;
                Feditor.canvas.requestRenderAll();
            }
            let _this = this;
            window.requestAnimationFrame(function(){_this.play();});
            //window.setTimeout(function(){_this.play();}, 20);
        },
    });
    
    fabric.ImgRotate.fromObject = function (object, callback) {
        return fabric.Object._fromObject('ImgRotate', object, callback);
    };
    
    // 字体图标
    fabric.FontIcon = fabric.util.createClass(fabric.Text, {
        type: 'FontIcon',
        initialize: function(options) {
            options || (options = { });
            
            options.fontFamily = 'FontAwesome';
            options.fontSize = options.fontSize ?? 40;
            options.fill = options.fill ?? 'green';
            options.textBackgroundColor = options.textBackgroundColor ?? 'transparent';
            options.originX = options.originX ?? 'left';
            options.originY = options.originY ?? 'top';
                
            this.callSuper('initialize', '王', options);
            this.set('icon', options.icon || '0xF015');

            this._updateAttr();
        },
        toObject: function() {
            return fabric.util.object.extend(this.callSuper('toObject'), {
                _zid: this.get('_zid'),
                _zbind: this.get('_zbind'),
                lock: this.get('lock'),
                icon: this.get('icon'),
            });
        },
        _render: function(ctx) {
            this.callSuper('_render', ctx);
        },
        _updateAttr() {
            this.text = String.fromCharCode(this.icon);
        },
    });
    
    fabric.FontIcon.fromObject = function (object, callback) {
        return fabric.Object._fromObject('FontIcon', object, callback);
    };
    
    // 计时器
    fabric.Timer = fabric.util.createClass(fabric.Group, {
        type: 'Timer',
        initialize: function (options) {
            options || (options = { });
            let list = [
                new fabric.Progress({top:0, left:0, width:120, height:35, val:0, zfill:'#666'}),
                new fabric.TextRect({top:0, left:0, width:120, height:35, text:'00:00:00', textFill:'#FFF', zfill:'transparent'}),
            ];
            this.callSuper('initialize', list, options);
            this.set('enabled', options.enabled ?? 1);
            this.set('_startTime', 0);
            this.set('_timeSpan', Feditor.getLocalInt(this._zid + '_timeSpan', 0));
            this.set('_timer', null);
            
            this.hoverCursor = this.enabled == 1 ? 'pointer' : 'default';
            
            let _this = this;
            this.on('mousedown', function(e){
                let obj = _this;
                if (obj.enabled == 0) return;
                if (Feditor.isEditor && !e.e.altKey) return;
                Feditor.showTimerMsg(obj);
            });
        },
        toObject: function() {
            return fabric.util.object.extend(this.callSuper('toObject'), {
                _zid: this.get('_zid'),
                _zbind: this.get('_zbind'),
                lock: this.get('lock'),
                enabled: this.get('enabled'),
            });
        },
        _play:function(){
            if (this._isDel) return;

            let t = t1 = Math.round((Date.now() - this._startTime) / 1000);
            let str = Feditor.buildTimerStr(t);
            if (this._objects[1].text == str) return;

            if (this._timeSpan > 0){
                this._objects[0].val = t1 / this._timeSpan * 100;
            }

            this._objects[1].text = str;

            if (this._timeSpan > 0 && this._timeSpan <= t1){
                window.clearInterval(this._timer);
                this._timer = null;
                this._objects[1].textFill = '#FFCA00';
                Feditor.playAlert();
            }

            this.dirty = true;
            Feditor.canvas.requestRenderAll();
        },
        _startPlay:function(){
            if (this._timer != null){
                window.clearInterval(this._timer);
            }
            this._startTime = Date.now();
            this._objects[1].textFill = '#0F0';
            this._objects[1].text = '00:00:00';
            this._objects[0].val = 0;
            let _this = this;
            this._timer = window.setInterval(function(){_this._play();}, 100);
        },
        _stopPlay:function(){
            window.clearInterval(this._timer);
            this._timer = null;
            this._objects[1].textFill = '#FFF';
            this.dirty = true;
            Feditor.canvas.requestRenderAll();
        },
        _updateAttr() {
            this.hoverCursor = this.enabled == 1 ? 'pointer' : 'default';
        },
        _render: function(ctx) {
            this.callSuper('_render', ctx);
        }
    });
    
    fabric.Timer.fromObject = function (object, callback) {
        return fabric.Object._fromObject('Timer', object, callback);
    };   
}
