
var Feditor = {
    el: null,
    canvas: null,
    width: 0,
    height: 0,
    pipePList: [],
    pipeCur: null,

    init: function (el) {
        this.el = el;

        $('#attrPage_width').val(FeditorData.page.width);
        $('#attrPage_height').val(FeditorData.page.height);
        this.width = FeditorData.page.width * window.devicePixelRatio;
        this.height = FeditorData.page.height * window.devicePixelRatio;
        el.prop('width', this.width);
        el.prop('height', this.height);
        window.onresize = this.resize;

        this.canvas = new fabric.Canvas(el.attr('id'), {
            preserveObjectStacking: true,
            selectionKey: 'ctrlKey',
        });

        //fabric.Object.prototype.originX = fabric.Object.prototype.originY = 'center';
        fabric.Text.prototype.originX = 'center';
        fabric.Object.prototype.transparentCorners = false;
        
        // let webglBackend, canvas2dBackend;
        // try {
        //     webglBackend = new fabric.WebglFilterBackend();
        // } catch (e) {
        //     canvas2dBackend = new fabric.Canvas2dFilterBackend();
        // }
        // fabric.filterBackend = webglBackend || canvas2dBackend;

        this.createComponent();
        this.bindInput();
        this.bindAnimate();
    },

    resize: function () { },

    /////// 自定义组件
    createComponent: function () {
        // 文本框
        fabric.TextRect = fabric.util.createClass(fabric.Rect, {
            type: 'TextRect',
            initialize: function (options) {
                options || (options = {});
                options.width = options.width || 100;
                options.height = options.height || 30;
                this.callSuper('initialize', options);
                this.set('text', options.text || '中文A123');
                this.set('textFill', options.textFill || '#000');
            },
            toObject: function () {
                return fabric.util.object.extend(this.callSuper('toObject'), {
                    _zid: this.get('_zid'),
                    _zbind: this.get('_zbind'),
                    text: this.get('text'),
                    textFill: this.get('textFill'),
                });
            },
            _render: function (ctx) {
                this.callSuper('_render', ctx);
                ctx.font = (this.height * 0.7) + 'px Helvetica';
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
            },
            toObject: function () {
                return fabric.util.object.extend(this.callSuper('toObject'), {
                    _zid: this.get('_zid'),
                    _zbind: this.get('_zbind'),
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
                this.set('fill', 'transparent');
                this.set('strokeWidth', options.strokeWidth || 1);
                this.set('stroke', options.stroke || '#000');

                this.set('min', options.min || 0);
                this.set('max', options.max || 100);
                this.set('step', options.step || 10);
                this.set('handColor', options.handColor || '#F00');
            },
            toObject: function() {
                return fabric.util.object.extend(this.callSuper('toObject'), {
                    min: this.get('min'),
                    max: this.get('max'),
                    step: this.get('step'),
                    handColor: this.get('handColor'),
                });
            },
            _render: function(ctx) {
                // transparent
                console.log(ctx);
                this.callSuper('_render', ctx);
                return;
                console.log('RectRule', this);
                ctx.clearRect(-this.width/2,-this.height/2,this.width,this.height);  
                ctx.rect(-this.width/2,-this.height/2,this.width,this.height);
                ctx.stroke();
            }
        });
    },

    /////// 绑定编辑值
    bindInput: function () {
        this.canvas.on('object:modified', function (options) {
            if (options.action == 'drag' && options.target._ztype == 'temp_pipe_point') {
                Feditor.resetCurPipe();
                return;
            }
        });
        this.canvas.on('selection:created', function (options) {
            if (options.selected.length != 1) return;
            Feditor.bindObj(options.selected[0]);
            if (options.selected[0].type == 'Pipe') {
                Feditor.createPipePoint(options.selected[0]);
            }
        });
        this.canvas.on('selection:updated', function (options) {
            if (options.selected.length != 1) return;
            $('.attr-type').hide();
            Feditor.bindObj(options.selected[0]);
            if (options.selected[0].type == 'Pipe') {
                Feditor.clearPipePoint();
                Feditor.createPipePoint(options.selected[0]);
            }
        });
        this.canvas.on('selection:cleared', function (options) {
            $('.attr-type').hide();
            Feditor.clearPipePoint();
        });
        this.canvas.on('object:moving', function (options) {
            if (!options.target._zid) return;
            if (options.target.type == 'Pipe') {
                Feditor.clearPipePoint();
            }
            Feditor.bindObj(options.target);
            Feditor.pipePointMove(options.target);
        });
        this.canvas.on('object:scaling', function (options) {
            if (!options.target._zid) return;
            Feditor.bindObj(options.target);
        });
        this.canvas.on('object:rotating', function (options) {
            if (!options.target._zid) return;
            Feditor.bindObj(options.target);
        });
        this.canvas.on('object:skewing', function (options) {
            if (!options.target._zid) return;
            Feditor.bindObj(options.target);
        });
        this.canvas.on('object:resizing', function (options) {
            if (!options.target._zid) return;
            Feditor.bindObj(options.target);
        });

        $('#attrPage_width, #attrPage_height').change(function () {
            let w = parseInt($('#attrPage_width').val());
            let h = parseInt($('#attrPage_height').val());
            FeditorData.page.width = w;
            FeditorData.page.height = h;

            Feditor.canvas.setDimensions({
                width: w * window.devicePixelRatio,
                height: h * window.devicePixelRatio,
            });
        });
        $('#attrPage_backgroundColor').change(function () {
            Feditor.canvas.backgroundColor = $(this).val();
            Feditor.canvas.renderAll();
        });
        $('#attrPage_zoom').change(function () {
            FeditorData.page.zoom = $(this).val();
            Feditor.canvas.setZoom($(this).val());
            Feditor.canvas.renderAll();
        });
        $('#divAttrList .attr').change(function () {
            let key = $(this).attr('id').substr(5);

            let obj = Feditor.canvas.getActiveObject();
            if (!obj || obj.type == 'activeSelection') return;

            if ($(this).attr('type') == 'checkbox') {
                obj.set(key, this.checked);
            }
            else if (key == 'angle') {
                obj.rotate($(this).val());
                Feditor.bindObj(obj);
            }
            else if (typeof (obj[key]) == 'number') {
                obj.set(key, parseFloat($(this).val()));
            }
            else {
                obj.set(key, $(this).val());
            }

            if (obj._updateAttr) {
                obj._updateAttr();
            }
            obj.dirty = true;
            //Feditor.canvas.renderAll();
        });
        $('#divAttrList .attrBind').change(function () {
            let key = $(this).attr('id').substr(9);

            let obj = Feditor.canvas.getActiveObject();
            if (!obj || obj.type == 'activeSelection') return;

            if (!obj._zbind) {
                obj._zbind = {};
            }

            obj._zbind[key] = $(this).val();
            console.log(obj);
        });

        // 绑定图片滤镜处理
        $('.divImageFilter input[type=checkbox]').each(function(index){
            $(this).data('key', $(this).attr('id').substr(7));
        });
        $('.divImageFilter input[type=checkbox]').change(function(index){
            let key = $(this).data('key');
            let fobj = null;
            if (this.checked)
            {
                let param = {};
                switch(key)
                {
                    case 'Convolute':
                        param = {
                            matrix: [ 1,   1,  1,
                                      1, 0.7, -1,
                                     -1,  -1, -1 ]
                          };
                        break;
                    case 'Gamma':
                        param['gamma'] = [
                            $('input[name=Gamma_red]').val(),
                            $('input[name=Gamma_green]').val(),
                            $('input[name=Gamma_blue]').val(),
                        ];
                        break;
                    default:
                        $(this).parent().parent().find('input, select').each(function(){
                            if ($(this).attr('type') == 'checkbox') return;
                            let vk = $(this).attr('name');
                            param[vk] = $(this).val();
                        });
                        break;
                }
                fobj = new fabric.Image.filters[key](param);
            }
            Feditor.applyFilter($(this), fobj);
        });
        $('.divImageFilter input,.divImageFilter select').bind('change, input', function(){
            let obj = Feditor.canvas.getActiveObject();
            if (!obj || obj.type != 'image') return;
            let key = $(this).parent().parent().find('input[type=checkbox]').data('key');
            let fobj = Feditor.getFilter(key);
            if (!fobj) return;
            if (key == 'Gamma'){
                fobj['gamma'] = [
                    $('input[name=Gamma_red]').val(),
                    $('input[name=Gamma_green]').val(),
                    $('input[name=Gamma_blue]').val(),
                ];
            } else {
                fobj[$(this).attr('name')] = $(this).val();
            }
            obj.applyFilters();
            Feditor.canvas.renderAll();
        });
    },

    attrReset: function () {
        let obj = Feditor.canvas.getActiveObject();
        if (!obj || obj.type == 'activeSelection') return;
        $('#attr_scaleX').val(1);
        $('#attr_scaleY').val(1);
        $('#attr_flipX')[0].checked = false;
        $('#attr_flipY')[0].checked = false;
        $('#attr_skewX').val(0);
        $('#attr_skewY').val(0);
        $('#attr_angle').val(0);
        obj.set({
            scaleX: 1,
            scaleY: 1,
            flipX: false,
            flipY: false,
            skewX: 0,
            skewY: 0,
            angle: 0,
        });

        Feditor.canvas.renderAll();
    },

    bindObj: function (obj) {
        if (obj._ztype) {
            $('.attr-type-' + obj._ztype).show();
        }
        else {
            $('.attr-type-' + obj.type).show();
        }
        $('#divAttrList .attr').each(function () {
            let key = $(this).attr('id').substr(5);

            if ($(this).attr('type') == 'checkbox') {
                this.checked = obj[key];
            }
            else if (typeof (obj[key]) == 'number') {
                $(this).val(obj[key].toFixed($(this).data('fix') || 0));
            }
            else {
                $(this).val(obj[key]);
            }
        });
        $('#divAttrList .attrBind').each(function () {
            let key = $(this).attr('id').substr(9);
            if (obj._zbind) {
                $(this).val(obj._zbind[key]);
            }
            else {
                $(this).val('');
            }
        });

        if (obj.type == 'image')
        {
            $('.divImageFilter input[type=checkbox]').prop('checked', false);
            for (let f of obj.filters)
            {
                if (!f) continue;
                
                $('#filter_' + f.type).prop('checked', true);
                if (f.type == 'Gamma'){
                    if (f.gamma){
                        $('input[name=Gamma_red]').val(f.gamma[0]);
                        $('input[name=Gamma_green]').val(f.gamma[1]);
                        $('input[name=Gamma_blue]').val(f.gamma[2]);
                    }
                }else{
                    $('#filter_' + f.type).parent().parent().find('input, select').each(function(){
                        if ($(this).attr('type') == 'checkbox') return;
                        let vk = $(this).attr('name');
                        $(this).val(f[vk]);
                    });
                }
            }
        }
    },

    /////// 层级处理
    bringToFront: function () {
        let obj = this.canvas.getActiveObject();
        if (!obj) return;
        obj.bringToFront();
    },
    bringForward: function () {
        let obj = this.canvas.getActiveObject();
        if (!obj) return;
        obj.bringForward();
    },
    sendToBack: function () {
        let obj = this.canvas.getActiveObject();
        if (!obj) return;
        obj.sendToBack();
    },
    sendBackwards: function () {
        let obj = this.canvas.getActiveObject();
        if (!obj) return;
        obj.sendBackwards();
    },

    toGroup: function () {
        let obj = this.canvas.getActiveObject();
        if (!obj || obj.type != 'activeSelection') return;
        obj.toGroup();
        this.canvas.renderAll();
    },
    splitGroup: function () {
        let obj = this.canvas.getActiveObject();
        if (!obj || obj.type == 'activeSelection') return;
        obj.toActiveSelection();
        this.canvas.renderAll();
    },

    /////// 元素添加

    addItem: function (item, active = true) {
        this.canvas.add(item);
        item.set('_zid', FeditorData.elIndex++);
        if (active) {
            this.canvas.setActiveObject(item);
        }

        return item;
    },

    addRect: function () {
        let item = new fabric.Rect({
            width: 100, height: 100, left: 50, top: 50,
            fill: '#99F',
            stroke: '#000', strokeWidth: 1,
        });

        item.lockScalingX = true;
        item.lockScalingY = true;

        this.addItem(item);
    },

    addCircle: function () {
        let item = new fabric.Circle({
            radius: 50, left: 50, top: 50,
            fill: '#9F9',
            stroke: '#000', strokeWidth: 1,
        });

        this.addItem(item);
    },

    addTriangle: function () {
        let item = new fabric.Triangle({
            width: 100, height: 100, left: 50, top: 50,
            fill: '#F99',
            stroke: '#000', strokeWidth: 1,
        });

        this.addItem(item);
    },

    addEllipse: function () {
        let item = new fabric.Ellipse({
            rx: 80, ry: 40, left: 50, top: 50,
            fill: '#FF9',
            stroke: '#000', strokeWidth: 1,
        });

        this.addItem(item);
    },

    addLine: function () {
        let item = new fabric.Line([10, 10, 100, 100], {
            fill: 'green',
            stroke: '#000', strokeWidth: 1,
        });

        this.addItem(item);
    },

    getStarPath: function (num) {
        let list = [];
        let bo = true;
        for (let i = 0; i <= 360; i += 360 / num / 2) {
            bo = !bo;
            let du = i * 0.017453293;
            list.push({
                x: 200 + Math.sin(du) * (bo ? 100 : 40),
                y: 200 + Math.cos(du) * (bo ? 100 : 40),
            });
        }

        return list;
    },

    addPolygon: function (num) {
        num = num || 5;
        let list = this.getStarPath(num);
        let item = new fabric.Polygon(list, {
            fill: '#9F9',
            stroke: '#000', strokeWidth: 1,
        });

        this.addItem(item);
    },

    addPolyline: function (num) {
        num = num || 5;
        let list = this.getStarPath(num);
        let item = new fabric.Polyline(list, {
            fill: 'transparent',
            stroke: '#000', strokeWidth: 1,
        });

        this.addItem(item);
    },

    addRing: function (angle1, angle2, x, y, r1, r2) {
        let point1 = {};
        let point2 = {};
        let point3 = {};
        let point4 = {};
        let isBig = 0
        angle1 = angle1 % 360;
        angle2 = angle2 % 360;

        if (angle2 > 180) {
            isBig = 1
        }

        let item = null;
        if (!angle2) {
            point1.x = r1 + x;
            point1.y = y;
            point2.x = r2 + x;
            point2.y = y;
            item = new fabric.Path(`M${point1.x},${point1.y} A${r1},${r1} 0 0,1 ${point1.x - 2 * r1},${point1.y}
            A${r1},${r1} 0 0,1 ${point1.x},${point1.y}
            M${point2.x},${point2.y} A${r2},${r2} 0 0,1 ${point2.x - 2 * r2},${point2.y}
            A${r2},${r2} 0 0,1 ${point2.x},${point2.y}`, {
                stroke: '#000',
                fill: '#F99',
            })
        } else {
            let d1 = angle1 / 180 * Math.PI;
            let d2 = (angle1 + angle2) / 180 * Math.PI;
            point1.x = r1 * Math.cos(d1) + x;
            point1.y = r1 * Math.sin(d1) + y;
            point2.x = r2 * Math.cos(d1) + x;
            point2.y = r2 * Math.sin(d1) + y;
            point3.x = r2 * Math.cos(d2) + x;
            point3.y = r2 * Math.sin(d2) + y;
            point4.x = r1 * Math.cos(d2) + x;
            point4.y = r1 * Math.sin(d2) + y;
            item = new fabric.Path(`M${point1.x},${point1.y} L${point2.x},${point2.y} A${r2},${r2} 0 ${isBig},1 ${point3.x},${point3.y} L${point4.x},${point4.y} A${r1},${r1} 0 ${isBig},0 ${point1.x},${point1.y}`, {
                stroke: '#000',
                fill: '#F99',
                // hasControls: false
            });
        }

        this.addItem(item);
    },

    addText: function (str) {
        str = str || 'Hello 中国123!';
        let item = new fabric.Text(str, {
            left: 100,
            top: 100,
            strokeWidth: 0,
            fontSize: 40,
            fill: 'green',
            textBackgroundColor: 'transparent',
            originX: 'left',
            originY: 'top',
        });

        this.addItem(item);
    },

    addPath: function (path) {
        if (!path) {
            path = window.prompt('输入绘图路径：', 'M 0 0 L 300 100 L 200 300 Z');
            if (!path) return;
        }
        let item = new fabric.Path(path);
        item.set({ stroke: 'green', fill: 'transparent', left: 100, top: 100 });
        this.addItem(item);
    },

    addTextbox: function (str) {
        str = str || 'Hello 中国123!';
        let item = new fabric.Textbox(str, {
            left: 100,
            top: 100,
            strokeWidth: 0,
            fontSize: 40,
            fill: 'green',
            textBackgroundColor: 'transparent'
        });

        this.addItem(item);
    },

    addImage: function (url) {
        if (!url) {
            url = window.prompt('输入图片路径：', '../static/img/img01.png');
            if (!url) return;
        }

        fabric.Image.fromURL(url, function (image) {
            image._element.crossOrigin='anonymous';
            image.set({
                left: 100,
                top: 100,
                shadow: new fabric.Shadow({ color: 'rgba(0,0,0,0.5)', offsetX: 10, offsetY: 10, blur: 10 })
            });
            image.scale(0.3).setCoords();

            Feditor.addItem(image);
        });
    },

    addButton: function (str) {
        str = str || 'button';
        let rect = new fabric.Rect({ width: 200, height: 50, fill: '#faa', rx: 10, ry: 10, strokeWidth: 0 });
        let text = new fabric.Text(str, { fontSize: 20, left: 100, top: 25, fontFamily: 'Georgia', strokeWidth: 0, textAlign: 'center', originX: 'center', originY: 'center', });
        let group = new fabric.Group([rect, text], { left: 100, top: 100, hasControls: false, hasBorders: false });

        this.addItem(group);
        //this.canvas.calcOffset();

        group.on('mouseover', function () {
            rect.fill = '#F00';
            group.dirty = true;
        });
        group.on('mouseout', function () {
            rect.fill = '#FAA';
            group.dirty = true;
        });
    },

    addPipe: function () {
        let item = new fabric.Pipe({
            left: 50, top: 50,
        });

        this.addItem(item);
    },

    addTextRect: function () {
        let item = new fabric.TextRect({
            left: 50, top: 50,
            fill: '#99F',
            stroke: '#000', strokeWidth: 1,
        });

        this.addItem(item);
    },
    
    addRectRule: function () {
        let item = new fabric.RectRule({
            left: 50, top: 50,
        });

        this.addItem(item);
    },

    /// 操作

    copy: function () {
        let obj = this.canvas.getActiveObject();
        if (!obj) return;
        if (obj.type != 'activeSelection') {
            obj.clone(function (objClone) {
                objClone.set({
                    top: objClone.top + 10,
                    left: objClone.left + 10,
                });

                Feditor.addItem(objClone);
            });
        }
        else {
            for (let r of obj._objects) {
                r.clone(function (objClone) {
                    objClone.set({
                        top: 10 + Feditor.canvas._activeObject.top + objClone.top + Feditor.canvas._activeObject.height / 2,
                        left: 10 + Feditor.canvas._activeObject.left + objClone.left + Feditor.canvas._activeObject.width / 2,
                    });

                    objClone.set('canvas', Feditor.canvas);
                    objClone.setCoords();

                    Feditor.addItem(objClone, false);
                });
            }
        }
    },

    delete: function () {
        let obj = this.canvas.getActiveObject();
        if (!obj) return;
        if (obj.type != 'activeSelection') {
            this.canvas.remove(obj);
        }
        else {
            for (let r of obj._objects) {
                this.canvas.remove(r);
            }
        }

        this.canvas._activeObject = null;
    },

    deleteAll: function () {
        this.canvas._objects = [];
        this.canvas._activeObject = null;
        this.canvas.renderAll();
    },

    save: function () {
        let json = this.canvas.toJSON(['_zid', '_ztype', '_zbind']);
        let saveData = {
            editor: FeditorData,
            data: json,
        };
        window.localStorage.setItem('Feditor_data', JSON.stringify(saveData));
        alert('保存成功');
    },

    reload: function () {
        let arr = window.localStorage.getItem('Feditor_data');
        if (!arr) return;
        let saveData = JSON.parse(arr);
        FeditorData = saveData.editor;

        this.canvas.setDimensions({
            width: FeditorData.page.width * window.devicePixelRatio,
            height: FeditorData.page.height * window.devicePixelRatio,
        });
        $('#attr_page_width').val(FeditorData.page.width);
        $('#attr_page_height').val(FeditorData.page.height);

        this.canvas.loadFromJSON(saveData.data, function () {
            Feditor.canvas.forEachObject(function (obj) {
                if (obj._ztype && obj._ztype.indexOf('temp') === 0) {
                    Feditor.canvas.remove(obj);
                }
            });
            Feditor.canvas.renderAll();
            $('#attr_page_backgroundColor').val(Feditor.canvas.backgroundColor);
            $('#attr_page_zoom').val(FeditorData.page.zoom);
            Feditor.canvas.setZoom(FeditorData.page.zoom);
        });
    },

    /// 对齐
    align: function (type) {
        let obj = this.canvas.getActiveObject();
        if (!obj) return;

        if (type == 'mhcenter') {
            //obj.set({left:this.canvas.width / 2 - obj.width / 2});
            obj.centerH();
            obj.setCoords();
            this.canvas.renderAll();
            return;
        }
        if (type == 'mvcenter') {
            //obj.set({top:this.canvas.height / 2 - obj.height / 2});
            obj.centerV();
            obj.setCoords();
            this.canvas.renderAll();
            return;
        }

        if (obj.type != 'activeSelection') return;

        if (type == 'mhavg') {
            obj._objects.sort((a, b) => {
                return a.left - b.left;
            });

            let totalW = 0;
            obj._objects.forEach(function (item) {
                totalW += item.width * item.scaleX;
            });

            let stepW = (obj.width - totalW) / (obj.size() - 1);
            let leftW = 0;
            for (let i = 0; i < obj.size(); i++) {
                obj._objects[i].set({ left: leftW - obj.width / 2 });
                leftW += obj._objects[i].width * obj._objects[i].scaleX + stepW;
            }
            this.canvas.renderAll();
            return;
        }
        if (type == 'mvavg') {
            obj._objects.sort((a, b) => {
                return a.top - b.top;
            });

            let totalH = 0;
            obj._objects.forEach(function (item) {
                totalH += item.height * item.scaleY;
            });

            let stepH = (obj.height - totalH) / (obj.size() - 1);
            let leftH = 0;
            for (let i = 0; i < obj.size(); i++) {
                obj._objects[i].set({ top: leftH - obj.height / 2 });
                leftH += obj._objects[i].height * obj._objects[i].scaleY + stepH;
            }
            this.canvas.renderAll();
            return;
        }

        obj._objects.forEach(function (item) {
            let w = item.width * item.scaleX;
            let h = item.height * item.scaleY;
            switch (type) {
                case 'left':
                    item.set({ left: 0 - obj.width * 0.5 })
                    break;
                case 'top':
                    item.set({ top: 0 - obj.height * 0.5 })
                    break;
                case 'right':
                    item.set({ left: obj.width * 0.5 - w })
                    break;
                case 'bottom':
                    item.set({ top: obj.height * 0.5 - h })
                    break;
                case 'vcenter':
                    item.set({ left: -w / 2 })
                    break;
                case 'hcenter':
                    item.set({ top: -h / 2 })
                    break;
            }
        });

        this.canvas.renderAll();
    },

    // 动画处理
    amIndex: 0,
    bindAnimate: function () {
        setTimeout(function animate() {
            Feditor.amIndex++;
            Feditor.canvas.forEachObject(function (obj) {
                if (!obj._zbind) return;
                if (obj._zbind.am1) Feditor.parseAnimate(obj, obj._zbind.am1, Feditor.amIndex);
                if (obj._zbind.am2) Feditor.parseAnimate(obj, obj._zbind.am2, Feditor.amIndex);
                if (obj._zbind.am3) Feditor.parseAnimate(obj, obj._zbind.am3, Feditor.amIndex);
            });
            Feditor.canvas.renderAll();
            //setTimeout(animate, 10);
            fabric.util.requestAnimFrame(animate);
        }, 100);
    },

    parseAnimate: function (obj, am, index) {
        let arr = am.split(',');
        let v = 0;
        if (arr.length < 2) return;
        switch (arr[0]) {
            case 'flow':
                v = parseFloat(arr[1]);
                if (v != 0) {
                    obj._objects[1].strokeDashOffset = index * v;
                    obj.dirty = true;
                }
                break;
            case 'rotate':
                v = parseFloat(arr[1]);
                if (v != 0) {
                    obj.rotate((index * v) % 360);
                    obj.dirty = true;
                }
                break;
            case 'blink':
                v = parseFloat(arr[1]) / 100;
                let blinkStep = arr.length > 2 ? parseFloat(arr[2]) : 100;
                if (v != 0) {
                    obj.set('opacity', index % blinkStep / blinkStep > v ? 1 : 0.1);
                    obj.dirty = true;
                }
                break;
            case 'mHeight':
                v = parseFloat(arr[1]);
                if (v != obj.height) {
                    let h = this.goVal(v, obj.height);
                    obj.set('height', h);
                    obj.dirty = true;
                }
                break;
            case 'mWidth':
                v = parseFloat(arr[1]);
                if (v != obj.width) {
                    let w = this.goVal(v, obj.width);
                    obj.set('width', w);
                    obj.dirty = true;
                }
                break;
            case 'move':
                if (arr.length == 3) {
                    let x = arr[1] === '' ? obj.left : parseFloat(arr[1]);
                    let y = arr[2] === '' ? obj.top : parseFloat(arr[2]);
                    if (x != obj.left) {
                        obj.set('left', this.goVal(x, obj.left));
                        obj.dirty = true;
                    }
                    if (y != obj.top) {
                        obj.set('top', this.goVal(y, obj.top));
                        obj.dirty = true;
                    }
                }
                break;
        }
    },

    goVal: function (v, cur) {
        let val = cur + (v - cur) * 0.02;
        if (Math.abs(v - cur) < 50) {
            val = cur + (v > cur ? 1 : -1);
        }

        if (Math.abs(v - cur) < 1) {
            val = v;
        }

        return val;
    },

    ///// Pipe 管道位置编辑
    clearPipePoint: function (bo) {
        for (let r of this.pipePList) {
            this.canvas.remove(r);
        }
        this.pipePList = [];

        if (!bo) {
            this.pipeCur = null;
        }
    },

    createPipePoint: function (o) {
        let list = o._objects[0].points;
        for (let k in list) {
            let r = list[k];
            let item = new fabric.Circle({
                radius: 5,
                left: o.left + r.x + o.pipeWidth * 0.5,
                top: o.top + r.y + o.pipeWidth * 0.5,
                fill: 'rgba(255,0,0,0.9)',
                stroke: '#000',
                strokeWidth: 0,
                hasControls: false,
                originX: 'center',
                originY: 'center',
            });

            let kIndex = parseInt(k);
            item._zPipePointIndex = kIndex;
            item._ztype = 'temp_pipe_point';
            this.addItem(item, false);
            this.pipePList.push(item);

            if (k < list.length - 1) {
                let x = (r.x + list[kIndex + 1].x) / 2;
                let y = (r.y + list[kIndex + 1].y) / 2;
                let item2 = new fabric.Circle({
                    radius: 5,
                    left: o.left + x + o.pipeWidth * 0.5,
                    top: o.top + y + o.pipeWidth * 0.5,
                    fill: 'rgba(255,0,0,0.5)',
                    stroke: '#000',
                    strokeWidth: 0,
                    hasControls: false,
                    originX: 'center',
                    originY: 'center',
                });

                item2._zPipePointIndex = kIndex + 0.5;
                item2._ztype = 'temp_pipe_point';
                this.addItem(item2, false);
                this.pipePList.push(item2);
            }
        }
        this.pipeCur = o;
    },

    addPipePoint(o) {
        o.fill = 'red';
        o.dirty = true;
        let curIndex = o._zPipePointIndex + 0.5;
        let p = this.pipeCur._objects[0].points[curIndex];
        let p1 = this.pipeCur._objects[0].points[curIndex - 1];
        let p2 = this.pipeCur._objects[0].points[curIndex + 1];

        // 前置点
        let x1 = (p1.x + p.x) / 2;
        let y1 = (p1.y + p.y) / 2;
        let item1 = new fabric.Circle({
            radius: 5,
            left: this.pipeCur.left + x1 + this.pipeCur.pipeWidth * 0.5,
            top: this.pipeCur.top + y1 + this.pipeCur.pipeWidth * 0.5,
            fill: 'rgba(255,0,0,0.5)',
            stroke: '#000',
            strokeWidth: 0,
            hasControls: false,
            originX: 'center',
            originY: 'center',
        });

        item1._zPipePointIndex = o._zPipePointIndex;
        item1._ztype = 'temp_pipe_point';
        this.addItem(item1, false);
        this.pipePList.splice(o._zPipePointIndex / 0.5, 0, item1);

        // 后置点
        let x2 = (p2.x + p.x) / 2;
        let y2 = (p2.y + p.y) / 2;
        let item2 = new fabric.Circle({
            radius: 5,
            left: this.pipeCur.left + x2 + this.pipeCur.pipeWidth * 0.5,
            top: this.pipeCur.top + y2 + this.pipeCur.pipeWidth * 0.5,
            fill: 'rgba(255,0,0,0.5)',
            stroke: '#000',
            strokeWidth: 0,
            hasControls: false,
            originX: 'center',
            originY: 'center',
        });

        item2._zPipePointIndex = o._zPipePointIndex + 1;
        item2._ztype = 'temp_pipe_point';
        this.addItem(item2, false);

        this.pipePList.splice(o._zPipePointIndex / 0.5 + 2, 0, item2);
        o._zPipePointIndex = curIndex;

        let list = this.pipeCur._objects[0].points;
        for (let i = 0; i < list.length; i++) {
            this.pipePList[i * 2]._zPipePointIndex = i;
            if (i < list.length - 1) {
                this.pipePList[i * 2 + 1]._zPipePointIndex = i + 0.5;
            }
        }

        console.log(this.pipePList);
    },

    pipePointMove: function (o) {
        if (o._ztype != 'temp_pipe_point') return;
        if (this.pipeCur == null) return;

        let x = o.left - this.pipeCur.left - this.pipeCur.pipeWidth * 0.5;
        let y = o.top - this.pipeCur.top - this.pipeCur.pipeWidth * 0.5;

        if (o._zPipePointIndex % 1 != 0) {
            // 创建拐点
            this.pipeCur._objects[0].points.splice(o._zPipePointIndex + 0.5, 0, { x: x, y: y });
            this.addPipePoint(o);
        }

        this.pipeCur._objects[0].points[o._zPipePointIndex].x = x;
        this.pipeCur._objects[0].points[o._zPipePointIndex].y = y;

        if (o._zPipePointIndex > 0) {
            let p1 = this.pipePList[o._zPipePointIndex * 2 - 1];
            let p2 = this.pipePList[o._zPipePointIndex * 2 - 2];
            p1.set({
                left: (o.left + p2.left) / 2,
                top: (o.top + p2.top) / 2,
            });
        }
        if (o._zPipePointIndex < this.pipeCur._objects[0].points.length - 1) {
            let p1 = this.pipePList[o._zPipePointIndex * 2 + 1];
            let p2 = this.pipePList[o._zPipePointIndex * 2 + 2];
            p1.set({
                left: (o.left + p2.left) / 2,
                top: (o.top + p2.top) / 2,
            });
        }
    },

    resetCurPipe: function () {
        if (this.pipeCur == null) return;
        let list = this.pipeCur._objects[0].points;
        if (list.length < 2) return;

        let minX = list[0].x;
        let minY = list[0].y;
        for (let p of list) {
            minX = Math.min(p.x, minX);
            minY = Math.min(p.y, minY);
        }

        for (let p of list) {
            p.x -= minX;
            p.y -= minY;
        }

        let item = new fabric.Pipe({
            left: this.pipeCur.left + minX,
            top: this.pipeCur.top + minY,
            list: list,

            pipeBackColor: this.pipeCur.pipeBackColor,
            pipeColor: this.pipeCur.pipeColor,
            pipeWidth: this.pipeCur.pipeWidth,
            pipeOpacity: this.pipeCur.pipeOpacity,
        });

        item._zbind = this.pipeCur._zbind;

        this.canvas.remove(this.pipeCur);
        this.clearPipePoint();
        this.addItem(item);
    },

    delPipePoint: function () {
        if (this.pipeCur == null) return;
        let obj = Feditor.canvas.getActiveObject();
        if (!obj || obj._ztype != 'temp_pipe_point') return;
        if (obj._zPipePointIndex % 1 != 0) return;

        let list = this.pipeCur._objects[0].points;
        if (list.length == 2) {
            return;
        }

        list.splice(obj._zPipePointIndex, 1);
        this.resetCurPipe();
    },

    ///// 图片滤镜
    applyFilter: function (o, filter) {
        let obj = Feditor.canvas.getActiveObject();
        if (!obj || obj.type != 'image') return;
        let key = o.data('key');
        let bo = true;
        for (let i=0; i<obj.filters.length; i++)
        {
            if (obj.filters[i] && obj.filters[i].type == key)
            {
                obj.filters[i] = filter;
                bo = false;
                break;
            }
        }

        if (bo)
        {
            obj.filters.push(filter);
        }

        obj.applyFilters();
        Feditor.canvas.renderAll();
    },

    getFilter: function (key) {
        let obj = Feditor.canvas.getActiveObject();
        if (!obj || obj.type != 'image') return null;
        let index = -1;
        for (let i=0; i<obj.filters.length; i++)
        {
            if (obj.filters[i] && obj.filters[i].type == key)
            {
                index = i;
                break;
            }
        }
        return obj.filters[index] || null;
    },
};
