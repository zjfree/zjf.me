var Feditor = {
    el: null,
    canvas: null,
    width: 0,
    height: 0,
    pipePList: [],
    pipeCur: null,
    isEditor: true,

    curNumInput:null,   // 当前数字输入框

    init: function (el, isEditor=true) {
        this.el = el;
        this.isEditor = isEditor;

        $('#attrPage_width').val(FeditorData.page.width);
        $('#attrPage_height').val(FeditorData.page.height);
        this.width = FeditorData.page.width * window.devicePixelRatio;
        this.height = FeditorData.page.height * window.devicePixelRatio;
        el.prop('width', this.width);
        el.prop('height', this.height);
        window.onresize = this.resize;

        $('dialog .dialog-close,dialog .close').click(Feditor.dialogClose);

        this.canvas = isEditor ? new fabric.Canvas(el.attr('id'), {
            preserveObjectStacking: true,
            selectionKey: 'ctrlKey',
        }) : new fabric.StaticCanvas(el.attr('id'), {
            preserveObjectStacking: true,
            selectionKey: 'ctrlKey',
        });

        //fabric.Object.prototype.originX = fabric.Object.prototype.originY = 'center';
        fabric.Text.prototype.originX = 'center';
        fabric.Object.prototype.cornerColor = 'rgba(0,0,0,0.5)';
        fabric.Object.prototype.transparentCorners = false;
        fabric.Object.prototype.objectCaching = false;
        fabric.Object.prototype.cornerSize = 8;
        fabric.Object.prototype.cornerStyle = 'circle';
        fabric.Object.prototype.borderDashArray = [3, 3];
        
        this.createComponent();
        this.bindInput();
        this.bindAnimate();
        this.testRandData();
        this.bindKey();
    },

    resize: function () { },

    /////// 绑定键盘按键
    bindKey:function(){
        window.addEventListener('keyup', function(e){
            if (!e.target || e.target.nodeName != 'BODY') return;
            e.stopPropagation();
            switch (e.code)
            {
                case 'ArrowUp':
                    Feditor.setPosition(0, -1, e.ctrlKey);
                    break;
                case 'ArrowDown':
                    Feditor.setPosition(0, 1, e.ctrlKey);
                    break;
                case 'ArrowLeft':
                    Feditor.setPosition(-1, 0, e.ctrlKey);
                    break;
                case 'ArrowRight':
                    Feditor.setPosition(1, 0, e.ctrlKey);
                    break;
                case 'Delete':
                    if (!Feditor.canvas._activeObject) return;
                    if (!e.ctrlKey){
                        if (!window.confirm('确认要删除元素吗?')) return;
                    }
                    Feditor.delete();
                    break;
                case 'KeyC':
                    if (e.ctrlKey){
                        Feditor.copy();
                    }
                    break;
            }
        }, true);
    },

    setPosition:function(x, y, fast){
        if (fast){
            x *= 5;
            y *= 5;
        }
        if (!Feditor.canvas._activeObject) return;
        let obj = Feditor.canvas._activeObject;
        obj.left = Math.round(obj.left + x);
        obj.top = Math.round(obj.top + y);
        obj.dirty = true;
        Feditor.canvas.requestRenderAll();

        Feditor.bindObj(obj);
    },

    getLocalVal: function(key, _val=null){
        let v = window.localStorage.getItem(key);
        if (v === null) return _val;

        return v;
    },
    getLocalInt: function(key, _val=null){
        let v = this.getLocalVal(key, _val);

        if (v !== null){
            v = parseInt(v);
        }

        return v;
    },
    setLocalVal: function(key, val){
        window.localStorage.setItem(key, val);
    },

    /////// 绑定编辑值
    bindInput: function () {
        
        $('#divAttrList .btn-attr').click(function(){
            let elId = $(this).data('id');
            let el = $(this).parents('table').find('#'+elId);
            if (!el) return;
            el.val($(this).data('val'));
            el.trigger('change');
        });

        $('#attr_zfill').bind('dblclick', function(){
            Feditor.curColorInput = null;
            Feditor.showColorMsg($(this).val() || '#00F');
        });
        $('.color-msg').bind('dblclick', function(){
            Feditor.curColorInput = $(this);
            Feditor.showColorMsg($(this).val() || '#00F', false);
        });
        
        this.canvas.on('mouse:move', function(options) {
            let str = 'X:' + Math.round(options.pointer.x);
            str += ', Y:' + Math.round(options.pointer.y);
            str += ';'
            if (options.target)
            {
                str += ' ' + options.target.type + ';';
            }
            $('#spanStatusPoint').html(str);
        });
        this.canvas.on('object:modified', function (options) {
            if (options.action == 'drag' && options.target._ztype == 'temp_pipe_point') {
                Feditor.resetCurPipe();
                return;
            }
        });
        this.canvas.on('selection:created', function (options) {
            if (options.selected.length > 1) return;
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
            $('#divBindAttr').hide();
            $('#divBindAttr').data('zid', '');
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
            $('#attrPage_backgroundColor').css('border-left', 'solid 1em ' + Feditor.canvas.backgroundColor);
            Feditor.canvas.requestRenderAll();
        });
        $('#attrPage_zoom').change(function () {
            FeditorData.page.zoom = $(this).val();
            Feditor.canvas.setZoom($(this).val());
            Feditor.canvas.requestRenderAll();
        });
        $('#attrPage_name,#attrPage_type,#attrPage_x,#attrPage_y').change(function () {
            FeditorData.page.name = $('#attrPage_name').val();
            FeditorData.page.type = $('#attrPage_type').val();
            FeditorData.page.x = $('#attrPage_x').val();
            FeditorData.page.y = $('#attrPage_y').val();
        });
        let attrChangeEvent = function () {
            let key = $(this).attr('id').substr(5);

            let obj = Feditor.canvas.getActiveObject();
            if (!obj || obj.type == 'activeSelection') return;

            if (key == 'angle') {
                obj.rotate($(this).val());
                Feditor.bindObj(obj);
            }
            else if ($(this).attr('type') == 'checkbox') {
                obj.set(key, this.checked);
            }
            else if (typeof (obj[key]) == 'number') {
                obj.set(key, parseFloat($(this).val()));
            }
            else {
                obj.set(key, $(this).val());
            }

            if (key == 'zfill') {
                let fillColor = Feditor.parseFillColor($(this).val());
                obj.set('fill', fillColor);
            }
            if (key == 'lock') {
                if (obj[key]){
                    obj.lockMovementX = true;
                    obj.lockMovementY = true;
                    obj.hasControls = false;
                }else{
                    obj.lockMovementX = false;
                    obj.lockMovementY = false;
                    obj.hasControls = true;
                }
            }

            if ($(this).hasClass('color-msg')) {
                $(this).css('border-left', 'solid 1em ' + $(this).val());
            }

            if (obj._updateAttr) {
                obj._updateAttr();
            }

            obj.dirty = true;
            Feditor.canvas.requestRenderAll();
        };
        $('#divAttrList .attr').change(attrChangeEvent);
        $('#divAttrList .attr[type=range]').bind('input', attrChangeEvent);

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
            obj.dirty = true;
            Feditor.canvas.requestRenderAll();
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

        obj.dirty = true;
        Feditor.canvas.requestRenderAll();
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

            if (key == 'zfill' && obj[key])
            {
                $('#attr_zfill').css('background', obj[key].indexOf('@') === 0 ? '#000' : obj[key]);
            }
            
            if ($(this).hasClass('color-msg'))
            {
                $(this).css('border-left', 'solid 1em ' + $(this).val());
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
        
        /*
        $('#divAttrList .attrBind').each(function () {
            let key = $(this).data('key');
            if (obj._zbind) {
                $(this).val(obj._zbind[key]);
            }
            else {
                $(this).val('');
            }
        });
        */

        this.buildBindAttr();
        this.buildEventAttr();
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
        obj.dirty = true;
        Feditor.canvas.requestRenderAll();
    },
    splitGroup: function () {
        let obj = this.canvas.getActiveObject();
        if (!obj || obj.type == 'activeSelection') return;
        obj.toActiveSelection();
        obj.dirty = true;
        Feditor.canvas.requestRenderAll();
    },

    /////// 元素添加

    addItem: function (item, active = true) {
        this.canvas.add(item);
        item.set('_zid', FeditorData.elIndex++);
        if (!item.zfill){
            item.zfill = typeof(item.fill) == 'string' ? item.fill : '';
        }

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
        item.set({ stroke: '#000', fill: 'blue', left: 100, top: 100 });
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

    addImage: function (url, scale) {
        if (!url) {
            url = window.prompt('输入图片路径：', '/static/img/img01.png');
            if (!url) return;
        }

        fabric.Image.fromURL(url, function (image) {
            image._element.crossOrigin = 'anonymous';
            image.set({
                left: 100,
                top: 100,
            });
            image.scale(scale||0.3).setCoords();

            Feditor.addItem(image);
            window.setTimeout(function(){
                image.dirty = true;
                Feditor.canvas.requestRenderAll();
            }, 50);
        });
    },

    addImageSvg: function (url) {
        if (!url) {
            url = window.prompt('输入图片路径：', '/static/img/test.svg');
            if (!url) return;
        }
        fabric.loadSVGFromURL(url, function(objects, options) {
            let shape = fabric.util.groupSVGElements(objects, options);
            shape.set({
                left: 100,
                top: 100,
            });
    
            Feditor.addItem(shape);
            Feditor.canvas.calcOffset();
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
        });

        this.addItem(item);
    },
    
    addRectRule: function () {
        let item = new fabric.RectRule({
            left: 50, top: 50,
        });

        this.addItem(item);
    },

    addRealMonitor: function () {
        let item = new fabric.RealMonitor({
            left: 50, top: 50,
        });

        this.addItem(item);
    },

    addRain: function () {
        let item = new fabric.Rain({
            left: 50, top: 50,
        });

        this.addItem(item);
    },

    addProgress: function () {
        let item = new fabric.Progress({
            left: 50, top: 50,
        });

        this.addItem(item);
    },

    addGauge: function () {
        let item = new fabric.Gauge({
            left: 50, top: 50,
        });

        this.addItem(item);
    },

    addSwitch: function () {
        let item = new fabric.Switch({
            left: 50, top: 50,
        });

        this.addItem(item);
    },

    addSwitchY: function () {
        let item = new fabric.SwitchY({
            left: 50, top: 50,
        });

        this.addItem(item);
    },

    addButton: function () {
        let item = new fabric.Button({
            left: 50, top: 50,
        });

        this.addItem(item);
    },
    
    addLight: function () {
        let item = new fabric.Light({
            left: 50, top: 50,
        });

        this.addItem(item);
    },

    addNumInput: function () {
        let item = new fabric.NumInput({
            left: 50, top: 50,
        });

        this.addItem(item);
    },

    addTable: function () {
        let item = new fabric.Table({
            left: 50, top: 50,
        });

        this.addItem(item);
    },

    addLiquid: function () {
        let item = new fabric.Liquid({
            left: 50, top: 50,
        });

        this.addItem(item);
    },
    
    addImgRotate: function (url) {
        if (!url) {
            url = window.prompt('输入图片路径：', '/static/img/fan/fan01.png');
            if (!url) return;
        }
        let item = new fabric.ImgRotate({
            left: 200, top: 200,
            imgUrl:url,
        });

        this.addItem(item);
    },

    addFontIcon: function () {
        let item = new fabric.FontIcon({
            left: 50, top: 50,
        });

        this.addItem(item);
    },
    
    addTimer: function () {
        let item = new fabric.Timer({
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
                objClone.set('_zid', FeditorData.elIndex++);
                objClone.set({
                    top: objClone.top + 10,
                    left: objClone.left + 10,
                });
                objClone.zfill = obj.zfill;
                objClone._zbind = obj._zbind;

                Feditor.addItem(objClone);
            });
        }
        else {
            for (let r of obj._objects) {
                r.clone(function (objClone) {
                    objClone.set('_zid', FeditorData.elIndex++);
                    objClone.set({
                        top: 10 + Feditor.canvas._activeObject.top + objClone.top + Feditor.canvas._activeObject.height / 2,
                        left: 10 + Feditor.canvas._activeObject.left + objClone.left + Feditor.canvas._activeObject.width / 2,
                    });
                    objClone.zfill = r.zfill;

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
            obj._isDel = true;
            this.canvas.remove(obj);
        }else{
            for (let r of obj._objects) {
                r._isDel = true;
                this.canvas.remove(r);
            }
        }

        this.canvas._activeObject = null;
    },

    deleteAll: function () {
        for (let r of this.canvas._objects){
            r._isDel = true;
        }
        this.canvas._objects = [];
        this.canvas._activeObject = null;
        Feditor.canvas.requestRenderAll();
    },

    save: function () {
        let json = this.canvas.toJSON(['_zid', '_ztype', '_zbind', 'zfill', 'lock']);
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
        $('#attrPage_width').val(FeditorData.page.width);
        $('#attrPage_height').val(FeditorData.page.height);
        $('#attrPage_name').val(FeditorData.page.name);
        $('#attrPage_type').val(FeditorData.page.type);
        $('#attrPage_x').val(FeditorData.page.x);
        $('#attrPage_y').val(FeditorData.page.y);
        
        this.canvas.loadFromJSON(saveData.data, function () {
            Feditor.canvas.forEachObject(function (obj) {
                if (obj._ztype && obj._ztype.indexOf('temp') === 0) {
                    Feditor.canvas.remove(obj);
                }
                if (obj.lock){
                    obj.lockMovementX = true;
                    obj.lockMovementY = true;
                    obj.hasControls = false;
                }
            });
            Feditor.canvas.renderAll();
            $('#attrPage_backgroundColor').val(Feditor.canvas.backgroundColor);
            $('#attrPage_backgroundColor').css('border-left', 'solid 1em ' + Feditor.canvas.backgroundColor);
            $('#attrPage_zoom').val(FeditorData.page.zoom);
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
            obj.dirty = true;
            Feditor.canvas.requestRenderAll();
            return;
        }
        if (type == 'mvcenter') {
            //obj.set({top:this.canvas.height / 2 - obj.height / 2});
            obj.centerV();
            obj.setCoords();
            obj.dirty = true;
            Feditor.canvas.requestRenderAll();
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
            obj.dirty = true;
            Feditor.canvas.requestRenderAll();
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
            obj.dirty = true;
            Feditor.canvas.requestRenderAll();
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

        obj.dirty = true;
        Feditor.canvas.requestRenderAll();
    },

    // 动画处理
    amIndex: 0,
    bindAnimate: function () {
        setTimeout(function animate() {
            Feditor.amIndex++;
            let bo = false;
            Feditor.canvas.forEachObject(function (obj) {
                if (!obj._zbindv || obj._isDel) return;
                if (obj._zbindv.am1) {
                    Feditor.parseAnimate(obj, obj._zbindv.am1, Feditor.amIndex);
                    bo = true;
                }
                if (obj._zbindv.am2) {
                    Feditor.parseAnimate(obj, obj._zbindv.am2, Feditor.amIndex);
                    bo = true;
                }
                if (obj._zbindv.am3) {
                    Feditor.parseAnimate(obj, obj._zbindv.am3, Feditor.amIndex);
                    bo = true;
                }
            });
            if (bo){
                Feditor.canvas.requestRenderAll();
            }
            //setTimeout(animate, 50);
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
                let selObj = this.canvas.getActiveObject();
                if (v != 0 && (selObj == null || obj._zid != selObj._zid)) {
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
        obj.dirty = true;
        Feditor.canvas.requestRenderAll();
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

    //// 系统工具

    // 数据随机生成器
    testRandData: function(){
        window.setInterval(function(){
            Feditor.canvas.forEachObject(function (obj) {
                if (obj.type && obj.type == 'RealMonitor') {
                    obj.setVal(Feditor.getRandSmooth(obj._zid, obj.min, obj.max, 0.5));
                }
            });
        }, 100);
    },

    randNumList:[],
    getRandSmooth:function(key, min=0, max=100, step=1){
        let v = this.randNumList[key] || ((max+min)/2);
        v += Math.random() <= 0.5 ? step : -step;
        this.randNumList[key] = this.limitNum(v);

        return v;
    },

    limitNum:function(v, min=0, max=100){
        v = Math.min(v, max);
        v = Math.max(v, min);
        return v;
    },


    ///// 绘图工具扩展
    ctx:null,
    deg2rad:function(deg)
    {
        return deg * Math.PI / 180;
    },

    ctxArc: function(p, r, deg1, deg2) {
        this.ctx.shadowBlur = 0;
        deg1 = Feditor.deg2rad(deg1 % 360);
        deg2 = Feditor.deg2rad(deg2 % 360);
        this.ctx.beginPath();
        this.ctx.arc(p.x, p.y, r, deg1, deg2);
        return this;
    },
    
    ctxFill:function (fillStyle='#000'){
        this.ctx.fillStyle = fillStyle;
        this.ctx.fill();
        return this;
    },

    ctxStroke:function (lineStyle='#000', lineWidth=1){
        if (lineWidth<=0) return;
        this.ctx.lineWidth = lineWidth;
        this.ctx.strokeStyle = lineStyle;
        this.ctx.stroke();
        return this;
    },
    
    textObj:null,
    ctxMeasureText:function()
    {
        if (this.textObj == null)
        {
            return null;
        }

        return this.ctx.measureText(this.textObj.text).width;
    },
    
    ctxText:function(p, str, align='left', font='14px Arial', maxWidth=null)
    {
        let fontSize = parseInt(font);
        if (fontSize != font)
        {
            fontSize = parseInt(font.replace(/[^0-9]/ig,""));
        }
        else
        {
            font = fontSize + 'px Arial';
        }

        let xAlign = 'left';
        let yAlign = 'alphabetic';
        let alignList = align.split(/,/ig);
        if (alignList.length == 2)
        {
            xAlign = alignList[0];
            yAlign = alignList[1] || 'alphabetic';
        }
        else if (align == 'center')
        {
            xAlign = 'center';
            yAlign = 'center';
        }
        else
        {
            xAlign = align;
        }
        if (yAlign == 'center')
        {
            yAlign = 'middle';
        }
        if (yAlign == 'default' || yAlign == 'base')
        {
            yAlign = 'alphabetic';
        }

        this.ctx.font = font;
        this.ctx.textAlign = xAlign;
        this.ctx.textBaseline = yAlign;

        this.textObj = {
            p:p,
            text:str,
            font:font,
            fontSize:fontSize,
            xAlign:xAlign,
            yAlign:yAlign,
            maxWidth:maxWidth,
        };

        return this;
    },
    
    ctxFillText:function (fillStyle='#000') 
    {
        if (this.textObj == null)
        {
            return null;
        }

        if (this.textObj.fontSize<=0) return;

        this.ctx.fillStyle = fillStyle;
        if (this.textObj.maxWidth === null)
        {
            this.ctx.fillText(this.textObj.text, this.textObj.p.x, this.textObj.p.y);
        }
        else
        {
            this.ctx.fillText(this.textObj.text, this.textObj.p.x, this.textObj.p.y, this.textObj.maxWidth);
        }

        return this;
    },
    
    ctxCircle:function(p, r) {
        this.ctx.beginPath();
        this.ctx.arc(p.x, p.y, r, 0, 2 * Math.PI);
        this.ctx.closePath();

        return this;
    },
    
    ctxArea:function(list) {
        if (!list || list.length < 3)
        {
            return;
        }

        this.ctx.beginPath();
        this.ctx.moveTo(list[0].x, list[0].y);
        for (let i=1; i<list.length; i++)
        {
            this.ctx.lineTo(list[i].x, list[i].y);
        }
        this.ctx.closePath();

        return this;
    },
    
    ctxLine:function(p1, p2) {
        this.ctx.shadowBlur = 0;
        this.ctx.beginPath();
        this.ctx.moveTo(p1.x, p1.y);
        this.ctx.lineTo(p2.x, p2.y);
        
        return this;
    },

    //// 颜色选择

    // 弹出框关闭
    dialogClose: function (e) {
        if (e) {
            e.stopPropagation();
            e.preventDefault();
        }
        $('dialog').each(function () { this.close(); });
        return false;
    },

    colorMsgIsInit:false,
    curColor:null,
    selColor:null,
    selColorVal:'',
    curMoveRect:null,
    curEditRect:null,
    curColorInput:null,

    showColorMsg:function(color, ext=true){
        if (!net.brehaut.Color) return;
        this.curEditRect = null;
        if (!this.colorMsgIsInit){
            this.colorMsgInit();
        }
        
        if (ext){
            $('#divColorExt').show();
        }else{
            $('#selGradientType').val('color');
            $('#divColorExt').hide();
        }

        $('#msgColor')[0].showModal();

        if (ext){
            color = this.parseColorVal(color);
        }
        this.setCurColor(color||'#FFF');
    },

    setCurColor:function(color){
        this.curColor = net.brehaut.Color(color);
        let c = this.curColor.toCSSHex();

        $('#spanCurColor').css('background-color', c);
        $('#spanCurColor').html(c);

        this.colorChange(this.curColor.toCSS());

        return c;
    },

    showColor2: function() {
        let hh = $('#rangeH1').val();
        let el = $('#myCanvas2');
        let w = el.width() * window.devicePixelRatio;
        let h = el.height() * window.devicePixelRatio;
        el.prop('width', w);
        el.prop('height', h);
        let ctx = el[0].getContext("2d");

        let max = 50;
        let size = Math.round(w / max);
        for (let x = 0; x < max; x++) {
            for (let y = 0; y < max; y++) {
                ctx.beginPath();
                ctx.rect(size * x, size * y, size, size);
                ctx.closePath();

                ctx.fillStyle = 'hsl(' + hh + ',' + (x*100/max) + '%,' + (y*100/max) + '%)';
                ctx.fill();
            }
        }
    },

    colorMsgInit: function(){
        this.colorMsgIsInit = true;
        this.showColor2();
        $('#rangeH1').bind('input', function(){
            let h = $(this).val();
            let s = Feditor.getInt(Feditor.selColor.getSaturation(), 100);
            let l = Feditor.getInt(Feditor.selColor.getLightness(), 100);
            let c = `hsl(${h},${s}%,${l}%)`;
            Feditor.colorChange(c, 'rangeH1');
            Feditor.showColor2();
        });
        let fn = function(e){
            if (e.buttons != 1) return;
            let hsl = {
                h:parseInt($('#rangeH1').val()),
                s:parseInt(100 * e.offsetX / $(this).width()),
                l:parseInt(100 * e.offsetY / $(this).height()),
            };
            
            let c = `hsl(${hsl.h},${hsl.s}%,${hsl.l}%)`;
            Feditor.colorChange(c, 'rangeH1');
        };
        $('#myCanvas2').mousemove(fn);
        $('#myCanvas2').mousedown(fn);

        $('#divColorBase span').click(function(){
            let c = '#' + $(this).html();
            if (c == '#透明')
            {
                c = 'transparent';
            }

            Feditor.colorChange(c);
            if (Feditor.curEditRect == null){
                $('#selGradientType').val('color');
            }
            $('#selGradientType').trigger('change');
        });
        $('#spanCurColor').click(function(){
            let c = $(this).html();
            if (!c) return;
            Feditor.colorChange(c);
        });
        
        $('#colorA').bind('input', function(){
            let v = parseFloat($(this).val());
            $('#spanCA').html(v);
            let c = Feditor.selColor.toCSSHex();
            Feditor.colorChange(c, 'spanCA');
        });
        
        $('#colorR,#colorG,#colorB').bind('input', function(){
            let c = 'rgb(';
            c += $('#colorR').val() + ',';
            c += $('#colorG').val() + ',';
            c += $('#colorB').val() + ')';
            Feditor.colorChange(c, 'RGB');
        });
        
        $('#colorH,#colorS,#colorL').bind('input', function(){
            let c = 'hsl(';
            c += $('#colorH').val() + ',';
            c += $('#colorS').val() + '%,';
            c += $('#colorL').val() + '%)';
            Feditor.colorChange(c, 'HSL');
        });

        $('#selGradientType').change(function(){
            let val = $(this).val();
            if (val != 'radial')
            {
                $('#divGradientLinear').show();
                $('#divGradientRadial').hide();
            }
            else
            {
                $('#divGradientLinear').hide();
                $('#divGradientRadial').show();
            }
            Feditor.showGradientDemo();
        });

        $('#divGradientLinear input, #divGradientRadial input').change(function(){
            Feditor.showGradientDemo();
        });

        $('#divGradientBase span').click(function(){
            $('#divGradientRectList div.rect').remove();

            let c1 = $(this).data('c1');
            let c2 = $(this).data('c2');
            $('#divGradientRectList .base').eq(0).css('background-color', c1).data('color', c1);
            $('#divGradientRectList .base').eq(1).css('background-color', c2).data('color', c2);

            if ($('#selGradientType').val() == 'color'){
                $('#selGradientType').val('linear');
                $('#selGradientType').trigger('change');
            }else{
                Feditor.showGradientDemo();
            }
        });

        $('#divGradientRectList .base').click(function(){
            if (Feditor.curEditRect != null){
                Feditor.curEditRect.css('border-radius', '0');
            }
            Feditor.curEditRect = $(this);
            $(this).css('border-radius', '50%');
            Feditor.setCurColor($(this).data('color'));
        });

        $('#divGradientShow').click(function(e){
            let c = Feditor.selColorVal;
            Feditor.addColorRect(c, e.offsetX - 5);
            Feditor.showGradientDemo();
        });

        $(document).bind('mousemove', function(e){
            if (Feditor.curMoveRect == null) return;
            let obj = Feditor.curMoveRect;
            let x = e.pageX - parseInt(obj.data('xCur')) + parseInt(obj.data('xStart'));
            x = Math.max(x, 0);
            x = Math.min(x, $('#divGradientShow').width());
            obj.css('left', x + 'px');
            Feditor.showGradientDemo();
        });
        $(document).bind('mouseup', function(){
            Feditor.curMoveRect = null;
        });
    },

    getInt:function(v, max){
        return Math.round(v*max);
    },

    addColorRect:function(c, left){
        let rect = $('<div class="rect" data-color="' + c + '"></div>');
        $('#divGradientRectList').append(rect);
        rect.css('left', left);
        rect.css('background-color', c);
        rect.dblclick(function(){
            $(this).remove();
            Feditor.showGradientDemo();
        });
        rect.bind('mousedown', function(e){
            if (Feditor.curEditRect != null){
                Feditor.curEditRect.css('border-radius', '0');
            }
            Feditor.curEditRect = Feditor.curMoveRect = $(this);
            Feditor.setCurColor($(this).data('color'));
            $(this).data('xCur', e.pageX);
            $(this).data('xStart', $(this).css('left'));
            $(this).css('border-radius', '50%');
        });
    },

    colorChange:function(color, el)
    {
        let cc = this.selColor = net.brehaut.Color(color);

        if (el != 'RGB'){
            $('#colorR').val(this.getInt(cc.getRed(), 255));
            $('#colorG').val(this.getInt(cc.getGreen(), 255));
            $('#colorB').val(this.getInt(cc.getBlue(), 255));
        }

        $('#spanCR').html(this.getInt(cc.getRed(), 255));
        $('#spanCG').html(this.getInt(cc.getGreen(), 255));
        $('#spanCB').html(this.getInt(cc.getBlue(), 255));
        
        if (el != 'HSL'){
            $('#colorH').val(this.getInt(cc.getHue(), 1));
            $('#colorS').val(this.getInt(cc.getSaturation(), 100));
            $('#colorL').val(this.getInt(cc.getLightness(), 100));
        }

        $('#divHuePoint').css({
            left:(this.getInt(cc.getSaturation(), $('#myCanvas2').width())-2.5) + 'px',
            top:(this.getInt(cc.getLightness(), $('#myCanvas2').height())-2.5) + 'px',
        });

        $('#spanCH').html(this.getInt(cc.getHue(), 1));
        $('#spanCS').html(this.getInt(cc.getSaturation(), 100));
        $('#spanCL').html(this.getInt(cc.getLightness(), 100));

        if (!el)
        {
            $('#colorA').val(cc.getAlpha().toFixed(2));
            $('#spanCA').html(cc.getAlpha().toFixed(2));
        }
        
        if (el != 'rangeH1')
        {
            $('#rangeH1').val(this.getInt(cc.getHue(), 1));
            this.showColor2();
        }

        this.setSelColorVal();
        this.showGradientDemo();
    },

    showGradientDemo:function(){
        let c1 = $('#divGradientRectList .base').eq(0).data('color');
        let c2 = $('#divGradientRectList .base').eq(1).data('color');

        let str = 'linear-gradient(to right,';
        let colorList =  c1 + ' 0%,';
        let colorValList = '0/' + c1 + '/';
        let arr = [];
        $('#divGradientRectList .rect').each(function(){
            arr.push({
                x:Math.round(parseInt($(this).css('left')) / $('#divGradientShow').width() * 100),
                c:$(this).data('color'),
            });
        });

        arr.sort(function(x, y){
            if (x.x < y.x) {
                return -1;
            }
            if (x.x > y.x) {
                return 1;
            }
            return 0;
        });

        for (let r of arr){
            colorList += r.c + ' ' + r.x + '%,';
            colorValList += r.x + '/' + r.c + '/';
        }
        colorList += c2 + ' 100%';
        colorValList += '100/' + c2;

        str += colorList + ')';

        $('#divGradientShow').css('background', str);

        // 绘制DEMO
        let gradientType = $('#selGradientType').val();
        let strDemo = '';
        let strVal = '';
        if (gradientType == 'color')
        {
            strDemo = this.selColorVal;
            strVal = this.selColorVal;
        } 
        if (gradientType == 'linear')
        {
            let p1 = new ZPoint($('#linearX0').val(), $('#linearY0').val());
            let p2 = new ZPoint($('#linearX1').val(), $('#linearY1').val());
            let deg = (p1.getDeg(p2) + 90) % 360;
            strDemo += 'linear-gradient(' + deg + 'deg,' + colorList + ')';
            strVal = '@linear|';
            strVal += $('#linearX0').val() + ',';
            strVal += $('#linearY0').val() + ',';
            strVal += $('#linearX1').val() + ',';
            strVal += $('#linearY1').val() + '|';
            strVal += colorValList;
        } 
        else if (gradientType == 'radial')
        {
            strDemo += 'radial-gradient(' + colorList + ')';
            strVal = '@radial|';
            strVal += $('#radialX0').val() + ',';
            strVal += $('#radialY0').val() + ',';
            strVal += $('#radialX1').val() + ',';
            strVal += $('#radialY1').val() + ',';
            strVal += $('#radialR0').val() + ',';
            strVal += $('#radialR1').val() + '|';
            strVal += colorValList;
        }

        $('#divGradientDemo').css('background', strDemo);
        $('#txtColorVal').val(strVal);
    },

    gradientFilp:function(){
        let obj1 = $('#divGradientRectList .base').eq(0);
        let obj2 = $('#divGradientRectList .base').eq(1);
        let c1 = obj1.data('color');
        let c2 = obj2.data('color');
        
        obj2.css('background-color', c1).data('color', c1);
        obj1.css('background-color', c2).data('color', c2);

        this.showGradientDemo();
    },

    saveColor:function(){
        this.showGradientDemo();
        this.dialogClose();
        let c = $('#txtColorVal').val();
        if (this.curColorInput){
            this.curColorInput.val(c);
            this.curColorInput.trigger('change');
        }else{
            $('#attr_zfill').val(c);
            $('#attr_zfill').css('background', c.indexOf('@') === 0 ? '#000' : c);
            $('#attr_zfill').trigger('change');
        }
    },

    setSelColorVal:function(){
        let c = this.selColor.toCSSHex();
        $('#spanSelColor').css('background-color', c);
        $('#spanSelColor').html(c);

        let v = parseFloat($('#colorA').val());
        this.selColorVal = c;
        if (v == 0){
            this.selColorVal = 'transparent';
        }else if (v < 1){
            this.selColorVal = 'rgba(' + Math.round(this.selColor.getRed() * 255) + ',';
            this.selColorVal += Math.round(this.selColor.getGreen() * 255) + ',';
            this.selColorVal += Math.round(this.selColor.getBlue() * 255) + ',';
            this.selColorVal += v + ')';
        }

        if (this.curEditRect != null)
        {
            this.curEditRect.css('background-color', this.selColorVal);
            this.curEditRect.data('color', this.selColorVal);
        }
    },

    parseColorVal:function(colorVal){

        $('#selGradientType').val('color');
        if (!colorVal){
            return '#000';
        }

        if (colorVal.indexOf('@') !== 0){
            return colorVal;
        }

        // @linear|0,0,1,0|0/#fff/43/rgba(36,198,36,0.74)/100/#99FF99
        // @radial|0,0,1,0,0,1|0/#fff/43/rgba(36,198,36,0.74)/100/#99FF99

        let arr = colorVal.split('|');
        if (arr.length != 3){
            return '#000';
        }

        $('#divGradientLinear').hide();
        $('#divGradientRadial').hide();
        let vals = arr[1].split(',');

        if (arr[0] == '@linear'){
            $('#divGradientLinear').show();
            $('#selGradientType').val('linear');
            $('#linearX0').val(vals[0]);
            $('#linearY0').val(vals[1]);
            $('#linearX1').val(vals[2]);
            $('#linearY1').val(vals[3]);
        }
        else if (arr[0] == '@radial'){
            $('#divGradientRadial').show();
            $('#selGradientType').val('radial');
            $('#radialX0').val(vals[0]);
            $('#radialY0').val(vals[1]);
            $('#radialX1').val(vals[2]);
            $('#radialY1').val(vals[3]);
            $('#radialR0').val(vals[4]);
            $('#radialR1').val(vals[5]);
        }

        let colors = arr[2].split('/');
        $('#divGradientRectList div.rect').remove();
        let w = $('#divGradientShow').width() || 200;
        for (let i=0; i<colors.length; i+=2){
            let per = parseFloat(colors[i]);
            let c = colors[i+1];
            if (per == 0){
                $('#divGradientRectList .base').eq(0).css('background-color', c).data('color', c);
            }else if (per == 100){
                $('#divGradientRectList .base').eq(1).css('background-color', c).data('color', c);
            }else{
                Feditor.addColorRect(c, per / 100 * w);
            }
        }

        return '#000';
    },

    parseFillColor:function(colorVal){
        if (!colorVal){
            return '#000';
        }

        if (colorVal.indexOf('@') !== 0){
            if (colorVal == 'rgba(0,0,0,0)'){
                return 'transparent';
            }
            return colorVal;
        }

        // @linear|0,0,1,0|0/#fff/43/rgba(36,198,36,0.74)/100/#99FF99
        // @radial|0,0,1,0,0,1|0/#fff/43/rgba(36,198,36,0.74)/100/#99FF99

        let arr = colorVal.split('|');
        if (arr.length != 3){
            return '#000';
        }

        let colorStops = [];
        let colors = arr[2].split('/');
        for (let i=0; i<colors.length; i+=2){
            colorStops.push({
                offset: parseFloat(colors[i]) / 100,
                color: colors[i+1],
            });
        }

        let gradient = null;
        if (arr[0] == '@linear'){
            gradient = new fabric.Gradient({
                type: 'linear',
                gradientUnits: 'percentage',
                coords: { 
                    x1: $('#linearX0').val(),
                    y1: $('#linearY0').val(),
                    x2: $('#linearX1').val(),
                    y2: $('#linearY1').val(),
                },
                colorStops:colorStops
            })
        }
        else if (arr[0] == '@radial'){
            gradient = new fabric.Gradient({
                type: 'radial',
                gradientUnits: 'percentage',
                coords: {
                    r1: $('#radialR0').val(), 
                    r2: $('#radialR1').val(), 
                    x1: $('#radialX0').val(),  
                    y1: $('#radialY0').val(),  
                    x2: $('#radialX1').val(),  
                    y2: $('#radialY1').val(),
                },
                colorStops: colorStops
            });
        }

        return gradient;
    },

    //// 数字输入弹出框
    
    numMsgIsInit:false,
    showNumInputMsg:function(numInput){
        if (this.curNumInput != null){
            this.curNumInput.isActive = false;
            this.curNumInput.dirty = true;
        }

        this.curNumInput = numInput;
        numInput.isActive = true;
        numInput.dirty = true;

        Feditor.canvas.requestRenderAll();

        if (!Feditor.numMsgIsInit){
            Feditor.numMsgInit();
        }

        $('#msgNumInput .msgTitle').html(numInput.inputInfo);
        $('#msgNumInput')[0].showModal();

        $('#numInput').val(numInput.val);
        $('#numInputRange').attr('min', numInput.numMin);
        $('#numInputRange').attr('max', numInput.numMax);
        $('#numInputRange').attr('step', numInput.numStep);
        $('#numInputRange').val(numInput.val);

        Feditor.setNumError(false);
        Feditor.loadNumLog();

        window.setTimeout(function(){
            $('#numInput').focus();
        }, 100);
    },

    numMsgInit:function(){
        if (this.numMsgIsInit) return;
        this.numMsgIsInit = true;
        $('#divNumKey span').click(function(){
            let v = $(this).html();
            let v1 = $('#numInput').val();
            switch (v)
            {
                case '重置':
                    $('#numInput').val(Feditor.curNumInput.val);
                    break;
                case '清空':
                    $('#numInput').val('');
                    break;
                case '最小':
                    $('#numInput').val(Feditor.curNumInput.numMin);
                    break;
                case '最大':
                    $('#numInput').val(Feditor.curNumInput.numMax);
                    break;
                case '+/-':
                    if (v1.indexOf('-') === 0){
                        $('#numInput').val(v1.substr(1));
                    }else{
                        $('#numInput').val('-' + v1);
                    }
                    break;
                default:
                    if (v1 == '0'){
                        v1 = '';
                    }
                    if (v1 == '-0'){
                        v1 = '-';
                    }
                    $('#numInput').val(v1 + v);
                    break;
            }

            $('#numInput').focus();
            Feditor.checkNumError();
        });

        $('#numInputRange').bind('input', function(){
            $('#numInput').val($(this).val());
            Feditor.setNumError(false);
        });

        $('#numInput').bind('input', function(){
            Feditor.checkNumError();
        });
        $('#numInput').change(function(){
            Feditor.checkNumError();
        });
        $('#numInput').keydown(function(e){
            if(e.keyCode==13){
                e.stopPropagation();
                e.preventDefault();
                Feditor.saveNumInput();
            };
        });
    },

    setNumError:function(bo){
        if (bo){
            $('#spanNumError').show();
            $('#numInput').css('background', '#fdd');
        }else{
            $('#spanNumError').hide();
            $('#numInput').css('background', '#ddd');
        }
    },

    checkNumError:function(){
        let v = $('#numInput').val();
        if (v == ''){
            Feditor.setNumError(false);
            return;
        }

        let v1 = parseFloat(v);
        if (isNaN(v1) || v.length != (''+v1).length){
            Feditor.setNumError(true);
            return;
        }

        if (v1 < Feditor.curNumInput.numMin || v1 > Feditor.curNumInput.numMax)
        {
            Feditor.setNumError(true);
            return;
        }

        Feditor.setNumError(false);
        $('#numInputRange').val(v1);
    },

    saveNumInput:function(){
        Feditor.checkNumError();
        if ($('#spanNumError').is(":visible")){
            return;
        }

        let v = $('#numInput').val();
        if (v == '') return;

        this.dialogClose();
        
        if (!this.curNumInput) return;

        this.curNumInput.val = parseFloat(v);
        this.curNumInput.dirty = true;

        Feditor.canvas.requestRenderAll();

        Feditor.saveNumLog(v);
    },

    saveNumLog:function(v){
        window.localStorage.setItem('NumInputLast', v);
        let list = this.getNumLog();
        if ($.inArray(v, list) !== -1) return;
        list.push(v);
        if (list.length > 4){
            list = list.slice(-4);
        }
        window.localStorage.setItem('NumInputLog_' + this.curNumInput._zid, JSON.stringify(list));
    },

    getNumLog:function(){
        let arr = window.localStorage.getItem('NumInputLog_' + this.curNumInput._zid);
        if (!arr) return [];
        return JSON.parse(arr);
    },

    loadNumLog:function(){
        let list = this.getNumLog();
        let last = window.localStorage.getItem('NumInputLast');
        if (last !== null && $.inArray(last, list) == -1){
            list.unshift(last);
        }
        $('#divNumLog').html('');
        for (let v of list){
            let el = $('<span>' + v + '</span>');
            $('#divNumLog').append(el);
            el.click(function(){
                $('#numInput').val($(this).html());
                Feditor.checkNumError();
            });
        }
    },
    
    //// 计时器弹出框
    
    timerMsgIsInit:false,
    timerObj:null,
    showTimerMsg:function(_timerObj){
        this.timerObj = _timerObj;
        if (!this.timerMsgIsInit){
            this.timerMsgInit();
        }

        $('#txtTimerSpan').val(this.buildTimerStr(_timerObj._timeSpan))

        if (_timerObj._timer == null){
            $('#txtTimerSpan').prop('readonly', '');
            $('#divTimerVal').show();
            $('#divTimerRun').hide();
            $('#btnTimerStart').show();
            $('#btnTimerStop').hide();
        }else{
            if (_timerObj._timeSpan == 0){
                $('#divTimerRun').hide();
            }else{
                let dt = _timerObj._startTime;
                $('#divTimerRun b').eq(0).html(this.formatDate(new Date(dt)));
                dt += _timerObj._timeSpan * 1000;
                $('#divTimerRun b').eq(1).html(this.formatDate(new Date(dt)));
                dt = _timerObj._timeSpan - (Date.now() - _timerObj._startTime) / 1000;
                dt = Math.round(dt);
                $('#divTimerRun b').eq(2).html(this.buildTimerStr(dt));
                $('#divTimerRun').show();
            }

            $('#txtTimerSpan').prop('readonly', 'readonly');
            $('#divTimerVal').hide();
            $('#btnTimerStart').hide();
            $('#btnTimerStop').show();
        }

        $('#msgTimer')[0].showModal();
    },
    timerMsgInit:function(){
        $('#divTimerVal span').click(function(){
            let str = ''+$(this).data('val');
            let v = Feditor.parseTimerStr($('#txtTimerSpan').val());
            if (str.indexOf('+') === 0){
                v += parseInt(str.substring(1));
                $('#txtTimerSpan').val(Feditor.buildTimerStr(v));
            }else if (str.indexOf('-') === 0){
                v -= parseInt(str.substring(1));
                if (v <= 0){
                    $('#txtTimerSpan').val('00:00:00');
                }else{
                    $('#txtTimerSpan').val(Feditor.buildTimerStr(v));
                }
            }else{
                $('#txtTimerSpan').val(str);
            }

        });

        this.timerMsgIsInit = true;
    },
    buildTimerStr:function(t){
        let str = ('0' + (t % 60)).slice(-2);
        t = Math.floor(t / 60);
        str = ('0' + (t % 60)).slice(-2) + ':' + str;
        t = Math.floor(t / 60);
        if (t > 10){
            str = t + ':' + str;
        }else{
            str =`0${t}:${str}`;
        }

        return str;
    },
    parseTimerStr:function(str){
        str = str.replace('：', ':');
        str = str.replace(' ', '');
        let list = str.split(':');
        list.reverse();

        let v = 0;
        if (list.length > 0){
            v += parseInt(list[0]);
        }
        if (list.length > 1){
            v += parseInt(list[1]*60);
        }
        if (list.length > 2){
            v += parseInt(list[2]*3600);
        }

        return v;
    },
    formatDate:function(d){
        d = d || new Date();
    
        let f = (v) => ('0' + v).slice(-2);
        return d.getFullYear() + '-'
            + f(d.getMonth() + 1) + '-'
            + f(d.getDate()) + ' '
            + f(d.getHours()) + ':'
            + f(d.getMinutes()) + ':'
            + f(d.getSeconds());
    },
    timerStart:function(){
        let str = $('#txtTimerSpan').val();
        let v = this.parseTimerStr(str);
        this.setLocalVal(this.timerObj._zid + '_timeSpan', v);
        this.timerObj._timeSpan = v;
        this.timerObj._startPlay();
        this.dialogClose();
    },
    timerStop:function(){
        this.timerObj._stopPlay();
        this.dialogClose();
    },

    playAlert:function(){
        $('#audioPlay')[0].play();
    },

    /////////// 数据绑定
    
    // 获取绑定列表
    getBindAttr:function(){
        let data = {
            base:[
                {name:'是否显示', code:'visable', type:'bool'},
                {name:'不透明度', code:'visable', type:'number', min:0, max:1},
                {name:'动画1', code:'am1', type:'am'},
                {name:'动画2', code:'am2', type:'am'},
                {name:'动画3', code:'am3', type:'am'},
                {name:'填充颜色', code:'zfill', type:'zfill'},
            ],
            list:[
                { type:'Rect', name:'方块', 
                    attrList:[
                        {name:'宽度', code:'width', type:'number', min:0},
                        {name:'高度', code:'height', type:'number', min:0},
                    ],
                },
                { type:'Circle', name:'圆形', 
                    attrList:[
                        {name:'半径', code:'radius', type:'number', min:0},
                    ],
                },
                { type:'Triangle', name:'三角形', attrList:[], },
                { type:'Ellipse', name:'椭圆', attrList:[], },
                { type:'Line', name:'线条', attrList:[], },
                { type:'Polygon', name:'多边形', attrList:[], },
                { type:'Polyline', name:'多边线', attrList:[], },
                { type:'Ring', name:'圆环', attrList:[], },
                { type:'Text', name:'文字', 
                    attrList:[
                        {name:'文字内容', code:'text', type:'string'},
                    ],
                },
                { type:'Path', name:'路径', attrList:[], },
                { type:'Textbox', name:'文本框', 
                    attrList:[
                        {name:'文字内容', code:'text', type:'string'},
                    ],
                },
                { type:'Image', name:'图片', 
                    attrList:[
                        {name:'旋转角度', code:'angle', type:'number'},
                        {name:'灰度', code:'filter_Grayscale', type:'bool'},
                        {name:'色相', code:'filter_Hue', type:'number'},
                    ],
                },
                { type:'Image', name:'图片', 
                    attrList:[
                        {name:'旋转角度', code:'angle', type:'number'},
                        {name:'灰度', code:'filter_Grayscale', type:'bool'},
                        {name:'色相', code:'filter_Hue', type:'number'},
                    ],
                },
                { type:'ImageSvg', name:'SVG图片', attrList:[], },
                { type:'Button', name:'按钮', 
                    attrList:[
                        {name:'文字', code:'text', type:'string'},
                        {name:'是否启用', code:'enabled', type:'bool'},
                    ],
                },
                { type:'Pipe', name:'管道', 
                    attrList:[
                        {name:'流体颜色', code:'pipeColor', type:'color'},
                        {name:'流体透明度', code:'pipeOpacity', type:'number', min:0, max:1},
                    ],
                },
                { type:'TextRect', name:'文本块', 
                    attrList:[
                        {name:'文字内容', code:'text', type:'string'},
                        {name:'文字颜色', code:'textFill', type:'color'},
                    ],
                },
                { type:'RectRule', name:'刻度尺', 
                    attrList:[
                        {name:'当前值', code:'val', type:'number'},
                        {name:'指针颜色', code:'handColor', type:'color'},
                    ],
                },
                { type:'RealMonitor', name:'实时折线', 
                    attrList:[
                        {name:'当前值', code:'val', type:'number'},
                        {name:'颜色', code:'color', type:'color'},
                    ],
                },
                { type:'Rain', name:'落下', 
                    attrList:[
                        {name:'下落速度', code:'speed', type:'number'},
                        {name:'颜色', code:'color', type:'color'},
                    ],
                },
                { type:'Progress', name:'进度', 
                    attrList:[
                        {name:'当前值', code:'val', type:'number'},
                        {name:'颜色', code:'color', type:'color'},
                    ],
                },
                { type:'Gauge', name:'仪表盘', 
                    attrList:[
                        {name:'当前值', code:'val', type:'number'},
                        {name:'颜色', code:'color', type:'color'},
                    ],
                },
                { type:'Switch', name:'开关', 
                    attrList:[
                        {name:'开关', code:'val', type:'bool'},
                        {name:'是否启用', code:'enabled', type:'bool'},
                    ],
                },
                { type:'SwitchY', name:'竖开关', 
                    attrList:[
                        {name:'开关', code:'val', type:'bool'},
                        {name:'是否启用', code:'enabled', type:'bool'},
                    ],
                },
                { type:'Light', name:'指示灯', 
                    attrList:[
                        {name:'开关', code:'val', type:'bool'},
                        {name:'是否启用', code:'enabled', type:'bool'},
                        {name:'颜色', code:'color', type:'number', min:0, max:360},
                    ],
                },
                { type:'NumInput', name:'数字输入', 
                    attrList:[
                        {name:'默认值', code:'val', type:'number', once:true},
                    ],
                },
                { type:'Table', name:'表格', attrList:[], },
                { type:'Liquid', name:'液体表面', 
                    attrList:[
                        {name:'颜色', code:'color', type:'color'},
                        {name:'是否播放', code:'isPlay', type:'bool'},
                    ],
                },
                { type:'ImgRotate', name:'图片旋转', 
                    attrList:[
                        {name:'旋转速度', code:'speed', type:'number'},
                        {name:'是否播放', code:'isPlay', type:'bool'},
                    ],
                },
                { type:'FontIcon', name:'字体图标', attrList:[], },
                { type:'ImgRotate', name:'图片旋转', 
                    attrList:[
                        {name:'旋转速度', code:'speed', type:'number'},
                        {name:'是否播放', code:'isPlay', type:'bool'},
                    ],
                },
                { type:'Timer', name:'计时器', 
                    attrList:[
                        {name:'是否启用', code:'enabled', type:'bool'},
                    ],
                },
    
            ]
        };

        return data;
    },

    // 构建绑定属性
    buildBindAttr: function(){
        let obj = Feditor.canvas.getActiveObject();
        if (!obj || obj.type == 'activeSelection'){
            $('#divBindAttr').hide();
            $('#divBindAttr table').html('');
            return;
        }

        if (obj._zid == $('#divBindAttr').data('zid'))
        {
            return;
        }
        
        $('#divBindAttr').data('zid', obj._zid);
        $('#divBindAttr table').html('');

        let str = '';
        let attr = Feditor.getBindAttr();
        let elAttr = null;
        for (let v of attr.list)
        {
            if (v.type.toLowerCase() == obj.type.toLowerCase())
            {
                elAttr = v.attrList;
            }
        }

        if (!elAttr) return;

        for (let v of elAttr)
        {
            let v2 = obj._zbind ? (obj._zbind[v.code] ?? '') : '';
            str += '<tr>';
            str += `<th>${v.name}:</th><td colspan="3"><input class="attrBind" data-key="${v.code}" data-vtype="${v.type}" type="text" value="${v2}" readonly /></td>`;
            str += '</tr>';
        }
        
        for (let v of attr.base)
        {
            let v1 = obj._zbind ? (obj._zbind[v.code] ?? '') : '';
            str += '<tr>';
            str += `<th>${v.name}:</th><td colspan="3"><input class="attrBind" data-key="${v.code}" data-vtype="${v.type}" type="text" value="${v1}" readonly /></td>`;
            str += '</tr>';
        }

        $('#divBindAttr table').html(str);
        $('#divBindAttr').show();

        $('#divBindAttr input').dblclick(function(){
            Feditor.bindMsgInit();
            Feditor.bindShow($(this));
            $('#msgBind')[0].showModal();
        });
    },

    bindMsgIsInit:false,
    bindMsgInit:function(){
        if (this.bindMsgIsInit) return;

        $('#divBindTab span').click(function(){
            $('#divBindTab span').removeClass('active');
            $(this).addClass('active');
            $('.divBindSource').hide();
            $('#divBindSource_' + $(this).data('tag')).show();
        });

        let bindKey = this.getBindKey();

        // sys
        this.objKeyList = [];
        this.getObjKeyList(bindKey.sys, 'sys');
        
        let strHtml = '';
        for (let v of this.objKeyList){
            strHtml += `<div class="item"><b>${v.key}</b><br><span>${v.val}</span></div>`;
        }
        $('#divBindSource_sys').html(strHtml);

        // base
        strHtml = '';
        for (let k in bindKey.base){
            strHtml += `<div class="item"><b>base.${k}</b><br><span>${bindKey.base[k]}</span></div>`;
        }
        $('#divBindSource_base').html(strHtml);
        
        // calc
        strHtml = '';
        for (let v of bindKey.calc){
            strHtml += `<div class="item"><b>calc.${v.code}</b><br><i>${v.name}<br>${v.key_list.join('<br>')}</i><span>${v.value}</span></div>`;
        }
        $('#divBindSource_calc').html(strHtml);

        // plc
        strHtml = '';
        for (let v1 of bindKey.plc){
            for (let v2 of v1.list){
                strHtml += `<div class="group"><div class="title"><i class="fa fa-angle-right"></i> ${v1.code} - ${v1.name} : ${v2.code} - ${v2.name}</div>`;
                for (let v3 of v2.list){
                    strHtml += `<div class="item"><b>plc.${v1.code}.${v2.code}.${v3.code}</b><br><i>${v3.name}</i><span>${v3.value}</span></div>`;
                }
                strHtml += '</div>';
            }
        }
        $('#divBindSource_plc').html(strHtml);

        // 绑定事件
        $('.divBindSource .item').click(function(){
            $('.divBindSource .item').removeClass('active');
            $(this).addClass('active');
            Feditor.curBindMsg.find('.spanBindValue').html($(this).find('b').html());
            Feditor.curBindMsg.find('.spanBindRawValue').html($(this).find('span').html());
            Feditor.curBindMsg.find('.spanBindLastValue').html('');
        });

        // 绑定tbInput
        $('.div_tbInput').html($('#divTbInputTemp').html());
    },

    objKeyList:[],
    getObjKeyList: function(obj, key){
        if (typeof(obj) !== 'object'){
            this.objKeyList.push({
                key:key,
                val:obj,
            });
            return;
        }

        for (let k in obj){
            this.getObjKeyList(obj[k], key + '.' + k);
        }
    },

    getBindKey:function(){
        let now = new Date();
        let obj = {
            sys:{
                user:{
                    user_type:'admin',
                    account:'zjf',
                    name:'张吉锋',
                    login_time:'2023-01-22 11:22:33',
                    power:['@all'],
                },
                now:{
                    str: this.formatDate(now),
                    vals:{
                        year:   now.getFullYear(),
                        month:  now.getMonth() + 1,
                        day:    now.getDate(),
                        hour:   now.getHours(),
                        minute: now.getMinutes(),
                        second: now.getSeconds(),
                    },
                    ms: now.getTime(),
                },
            },
            base:{
                null:'NULL',
				bool_true: true,
				bool_false: false,
				string_empty: '',
				string_val: '@@input',
				number_zero: 0,
				number_val: '@@input',
				number_rand:'@@input',
				number_rand_list:'@@input',
				color_fff:'#FFF',
				color_000:'#000',
				color_f00:'#F00',
				color_0f0:'#0F0',
				color_00f:'#00F',
				color_val:'@@input',
				color_rand_list:'@@input',
            },
            plc:[
                {name:'PLC01', code:'P001', list:[
                    {name:'DB01', code:'D001', list:[
                        {name:'磨机电流', code:'moji_dianliu', value:12},
                        {name:'磨机开关', code:'moji_kaiguan', value:1},
                    ],},
                    {name:'DB23', code:'D023', list:[
                        {name:'沥青累计用量', code:'liqing_total', value:23658},
                        {name:'SBS累计用量', code:'sbs_total', value:5428},
                    ],},
                ],},
                {name:'PLC02', code:'P002', list:[
                    {name:'DB01', code:'D001', list:[
                        {name:'磨机电流', code:'moji_dianliu', value:12},
                        {name:'磨机开关', code:'moji_kaiguan', value:1},
                        {name:'搅拌器开关', code:'jbq_sw', value:1},
                    ],},
                    {name:'DB23', code:'D023', list:[
                        {name:'沥青累计用量', code:'liqing_total', value:23658},
                        {name:'SBS累计用量', code:'sbs_total', value:5428},
                        {name:'搅拌罐液位', code:'jbg_level', value:3645},
                    ],},
                ],}
            ],
            // return new Function(...names, 'return 1;')(...vals);
            calc:[
                {name:'组合计算1', code:'calc01', value:12, key_list:[
                    'plc.P001.D023', 'sys.now.vals.second',
                ], js:`
                    let k = k1 + k2;
                    let v = 0;
                    if (k > 1000){
                        v = k;
                    }else{
                        v = k +20;
                    }

                    return v;
                `},
                {name:'组合计算2', code:'calc02', value:24, key_list:[
                    'plc.P002.D023', 'base.number_zero',
                ], js:`
                    let k = k1 + k2;
                    let v = 0;
                    if (k > 1000){
                        v = k;
                    }else{
                        v = k +20;
                    }

                    return v;
                `},
            ],
        };

        return obj;
    },

    curBindInput:null,
    curBindMsg:null,
    bindShow:function(el){
        let type = el.data('vtype');
        $('.divBindContent').hide();

        this.curBindInput = el;
        this.curBindMsg = curEl = $('#divBindContent_bool');
        if ($.inArray(type, ['bool', 'color', 'zfill']) == -1){
            this.curBindMsg = curEl = $('#divBindContent_' + type);
        }

        $('.divBindSource .item').removeClass('active');

        curEl.find('.spanBindType').html(type);
        curEl.find('.spanBindKey').html(el.data('key'));
        curEl.find('.spanBindName').html(el.parent().parent().find('th').html().replace(':',''));

        curEl.find('.spanBindRawValue').html('');
        curEl.find('.spanBindLastValue').html('');
        
        let str = el.val();
        let ifList = [];
        str = $.trim(str).replaceAll("'", '"');

        if (str == '')
        {
            // 清空设置
            switch (type){
                case 'string':
                    curEl.find('.txtBindPre').val('');
                    curEl.find('.txtBindSuf').val('');
                    curEl.find('.txtBindFormat').val('');
                    curEl.find('.numBindA').val(1);
                    curEl.find('.numBindB').val(0);
                    break;
                case 'number':
                    curEl.find('.numBindA').val(1);
                    curEl.find('.numBindB').val(0);
                    curEl.find('.numBindDec').val(0);
                    break;
                default:
                    break;
            }

            curEl.find('.spanBindValue').html('');
            curEl.find('.chkToNum').prop('checked', false);
            curEl.find('.txtBindPre').val('');
            curEl.find('.txtBindElseValue').val('');
        }
        else
        {
            // 设置赋值
            let obj = JSON.parse(str);
            ifList = obj.ifList;
            
            curEl.find('.spanBindValue').html(obj.bindKey ?? '');
            curEl.find('.chkToNum').prop('checked', obj.isNum ?? false);
            curEl.find('.txtBindPre').val(obj.rawPre ?? '');
            curEl.find('.txtBindElseValue').val(obj.elseVal ?? '');
            
            let curKeyEl = this.getBindKeyItem(obj.bindKey);
            curKeyEl.addClass('active');
            curEl.find('.spanBindRawValue').html(curKeyEl.find('span').html());

            switch (type){
                case 'string':
                    curEl.find('.txtBindPre').val(obj.strPre ?? '');
                    curEl.find('.txtBindSuf').val(obj.strSuf ?? '');
                    curEl.find('.txtBindFormat').val(obj.numFormat ?? '');
                    curEl.find('.numBindA').val(obj.numA ?? 1);
                    curEl.find('.numBindB').val(obj.numB ?? 0);
                    break;
                case 'number':
                    curEl.find('.numBindA').val(obj.numA ?? 1);
                    curEl.find('.numBindB').val(obj.numB ?? 0);
                    curEl.find('.numBindDec').val(obj.numDec ?? 0);
                    break;
                default:
                    break;
            }
        }

        let tb = curEl.find('.tbInput');
        this.tbInputClear(tb);
        for (let v of ifList){
            this.tbInputAdd2(tb, v);
        }

        curEl.show();
    },

    getBindKeyItem:function(key){
        let el = null;
        $('.divBindSource .item').each(function(){
            if (key == $(this).find('b').html()){
                el = $(this);
            }
        });

        return el;
    },

    getBindVal:function(key){
        let val = '';
        $('.divBindSource .item').each(function(){
            if (key == $(this).find('b').html()){
                val = $(this).find('span').html();
            }
        });

        return val;
    },

    tbInputClear:function(tb){
        let tr = tb.find('tbody tr').eq(0).clone();
        tb.find('tbody').html('');
        tb.find('tbody').append(tr);
    },

    tbInputAdd:function(o){
        let tb = $(o).parent().find('.tbInput');
        let tr = tb.find('tbody tr').eq(0).clone();
        tr.show();
        tb.find('tbody').append(tr);
    },
    tbInputAdd2:function(tb, v){
        let tr = tb.find('tbody tr').eq(0).clone();
        tr.show();
        tb.find('tbody').append(tr);
        if (v){
            tr.find('.selCompare').val(v[0]);
            tr.find('.txtCompare').val(v[1]);
            tr.find('.txtBindResValue').val(v[2]);
        }
    },

    buildBindObj:function(){
        if (!this.curBindMsg) return;
        if (!this.curBindInput) return;

        let curEl = this.curBindMsg;
        let type = curEl.find('.spanBindType').html();

        let obj = {
            type:       type,
            bindKey:    curEl.find('.spanBindValue').html(),
            isNum:      curEl.find('.chkToNum')[0].checked,
            rawPre:     curEl.find('.txtBindPre').val(),
            elseVal:    curEl.find('.txtBindElseValue').val(),
            ifList:     [],
        };
        
        switch (type){
            case 'string':
                obj.strPre = curEl.find('.txtBindPre').val();
                obj.strSuf = curEl.find('.txtBindSuf').val();
                obj.numFormat = curEl.find('.txtBindFormat').val();
                obj.numA = curEl.find('.numBindA').val();
                obj.numB = curEl.find('.numBindB').val();
                break;
            case 'number':
                obj.numA = curEl.find('.numBindA').val();
                obj.numB = curEl.find('.numBindB').val();
                obj.numDec = curEl.find('.numBindDec').val();
                break;
            default:
                break;
        }

        curEl.find('tbody tr').each(function(index){
            if (index == 0) return;
            obj.ifList.push([
                $(this).find('.selCompare').val(),
                $(this).find('.txtCompare').val(),
                $(this).find('.txtBindResValue').val(),
            ]);
        });

        return obj;
    },

    attrBindSave:function(){
        let fobj = Feditor.canvas.getActiveObject();
        if (!fobj || fobj.type == 'activeSelection') return;

        let obj = this.buildBindObj();

        if (obj.bindKey == '' || obj.bindKey == 'base.null')
        {
            this.curBindInput.val('');
        }
        else
        {
            this.curBindInput.val(JSON.stringify(obj).replaceAll('"',"'"));
        }

        if (!fobj._zbind){
            fobj._zbind = {};
        }
        fobj._zbind[this.curBindInput.data('key')] = this.curBindInput.val();
        console.log(this.curBindInput.val());

        this.dialogClose();
        
        this.curBindMsg = null;
        this.curBindInput = null;
    },

    /////////// 事件绑定

    // 允许绑定事件的元素列表
    eventTypeList:[ 'Button', 'Switch', 'SwitchY', 'Light', 'NumInput', 'Timer' ],
    
    // 构建绑定属性
    buildEventAttr: function(){
        let obj = Feditor.canvas.getActiveObject();
        if (!obj || obj.type == 'activeSelection'){
            $('#divEventAttr').hide();
            $('#divEventAttr table').html('');
            return;
        }

        if (obj._zid == $('#divEventAttr').data('zid'))
        {
            return;
        }
        
		$('#divEventAttr').hide();
        $('#divEventAttr').data('zid', obj._zid);
        $('#divEventAttr table').html('');

        if ($.inArray(obj.type, Feditor.eventTypeList) === -1)
        {
            return;
        }

        let val1 = '';
        let val2 = '';
        if (obj._zbind)
        {
            val1 = obj._zbind._event1 ?? '';
            val2 = obj._zbind._event2 ?? '';
        }

        let str = '';
        str += '<tr>';
        str += `<th>事件1:</th><td colspan="3"><input class="attrEvent" type="text" data-key="_event1" value="${val1}" readonly /></td>`;
        str += '</tr>';
        str += '<tr>';
        str += `<th>事件2:</th><td colspan="3"><input class="attrEvent" type="text" data-key="_event2" value="${val2}" readonly /></td>`;
        str += '</tr>';

        $('#divEventAttr table').html(str);
        $('#divEventAttr').show();

        $('#divEventAttr input').dblclick(function(){
            Feditor.eventMsgInit();
            Feditor.eventShow($(this));
            $('#msgEvent')[0].showModal();
        });
    },

    eventMsgIsInit:false,
    eventMsgInit:function(){
        if (this.eventMsgIsInit) return;

        $('#selEventType').change(function(){
            $('.event_input').hide();
            let k = '.ei_' + $(this).val().replaceAll('.', '_');
            $(k).show();
        });
    },

    curEventInput:null,
    eventShow:function(el){
        this.curEventInput = el;

        $('.event_input').hide();
        $('#selEventType').val('null');
        
        let str = el.val();
        str = $.trim(str).replaceAll("'", '"');

        if (str == '')
        {
            // 清空设置
            $('#msgEvent input').val('');
        }
        else
        {
            // 设置赋值
            let obj = JSON.parse(str);
            $('#selEventType').val(obj.eventType);
            let k = '.ei_' + obj.eventType.replaceAll('.', '_');
            $(k).show();
            $('#divEventInput input').each(function(){
                let k = $(this).data('key');
                $(this).val(obj[k] ?? '');
            });
        }
    },
    
    attrEventSave:function(){
        let fobj = Feditor.canvas.getActiveObject();
        if (!fobj || fobj.type == 'activeSelection') return;

        let obj = {
            eventType:$('#selEventType').val(),
        };

        $('#divEventInput input').each(function(){
            let k = $(this).data('key');
            obj[k] = $(this).val();
        });

        if (obj.eventType == '' || obj.eventType == 'null')
        {
            this.curEventInput.val('');
        }
        else
        {
            this.curEventInput.val(JSON.stringify(obj).replaceAll('"',"'"));
        }

        if (!fobj._zbind){
            fobj._zbind = {};
        }
        fobj._zbind[this.curEventInput.data('key')] = this.curEventInput.val();
        console.log(this.curEventInput.val());

        this.dialogClose();
        
        this.curEventInput = null;
    },
};

