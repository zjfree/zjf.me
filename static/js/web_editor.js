
var ZEditor = {
    work:{
        melIndex:1,
        zindexMin:10000,
        zindexMax:10000,
    },
    page:{
        width:800,
        height:800,
        background_color:'',
        background_image:'',
    },
    curMel:null,
    init:function(){
        
        let saveData = localStorage.getItem('data');
        if (saveData)
        {
            saveData = JSON.parse(saveData);
            ZEditor.work = saveData.work;
            ZEditor.page = saveData.page;
            $('#divDraw').html(saveData.html);
            $('#divDraw .mel').each(function(){
                let mel = $(this);
                if (mel.find('.edit-bar').length > 0)
                {
                    mel.myDrag({
                        handler: '.edit-bar',
                        parent: $('#divDraw'),
                    });

                    /*
                    mel.draggabilly({
                        handle: '.edit-bar',
                        containment: $('#divDraw'),
                        grid: [ 1, 1 ]
                    });
                    */
                }
                else
                {
                    mel.myDrag({
                        parent: $('#divDraw'),
                    });

                    /*
                    mel.draggabilly({
                        containment: $('#divDraw'),
                        grid: [ 1, 1 ]
                    });
                    */
                }
            });
            $('#divDraw .mel').click(function(){
                ZEditor.selectMel($(this));
            });
        }

        // 页面属性绑定
        $('#attr_page_css_width').val(ZEditor.page.width);
        $('#attr_page_css_height').val(ZEditor.page.height);
        $('#attr_page_css_background')[0].jscolor.fromString(ZEditor.page.background_color);
        $('#attr_page_css_background_image').val(ZEditor.page.background_image);

        ZEditor.pageUpdate();

        // 点击背景取消选中
        $('#divDraw').click(function(e){
            if (e.target != e.currentTarget) return;
            if (ZEditor.curMel != null)
            {
                ZEditor.curMel.removeClass('active');
            }
            ZEditor.curMel = null;
        });

        // 绑定属性更改事件
        $('.event').each(function(){
            let o = $(this);
            //console.log(this.tagName, this);

            let event = o.data('event');
            if (!event) return;
            if (!ZEditor[event]) return;

            o.change(ZEditor[event]);
            o.keyup(function(e){
                if (e.keyCode == 13) ZEditor[event]();
            });
        });
        
        $('#divDraw').mousemove(function(e) {
            let x = Math.round(e.pageX - $(this).offset().left);
            let y = Math.round(e.pageY - $(this).offset().top);

            $('#divTaskMouse span').html(x + ', ' + y);
        });

        // 全局快捷键
        $(document).keydown(function (e) {
            if (e.target.tagName != 'BODY') return;
            //console.log(e.key, e.keyCode, e);
            switch(e.keyCode)
            {
                case 37:
                    // 向左键
                    return !ZEditor.moveMel(-1, 0, e);
                    break;
                case 38:
                    // 向上键
                    return !ZEditor.moveMel(0, -1, e);
                    break;
                case 39:
                    // 向右键
                    return !ZEditor.moveMel(1, 0, e);
                    break;
                case 40:
                    // 向下键
                    return !ZEditor.moveMel(0, 1, e);
                    break;
                case 46:
                    // 删除键
                    if (ZEditor.curMel == null) return;
                    ZEditor.btnDel();
                    break;
                default:
                    break;
            }
        });
    },
    moveMel:function(x, y, e){
        if (ZEditor.curMel == null) return false;
        if (e.ctrlKey)
        {
            let width = ZEditor.curMel.css('width').replace('px', '');
            let height = ZEditor.curMel.css('height').replace('px', '');
            width = parseInt(width);
            height = parseInt(height);
            width += x;
            height += y;
            ZEditor.curMel.css('width', width + 'px');
            ZEditor.curMel.css('height', height + 'px');
            $('#attr_css_width').val(width);
            $('#attr_css_height').val(height);
        }
        else
        {
            let top = ZEditor.curMel.css('top').replace('px', '');
            let left = ZEditor.curMel.css('left').replace('px', '');
            top = parseInt(top);
            left = parseInt(left);
            left += x;
            top += y;
            ZEditor.curMel.css('left', left + 'px');
            ZEditor.curMel.css('top', top + 'px');
            $('#attr_css_left').val(left);
            $('#attr_css_top').val(top);
        }

        return true;
    },
    pageUpdate:function(){
        ZEditor.page.width = $('#attr_page_css_width').val();
        ZEditor.page.height = $('#attr_page_css_height').val();
        ZEditor.page.background_color = $('#attr_page_css_background').val();
        ZEditor.page.background_image = $('#attr_page_css_background_image').val();

        $('#divDraw, #divGrid').css({
            'width':ZEditor.page.width+'px',
            'height':ZEditor.page.height+'px',
        });
        $('#divGrid').css({
            'background-color':ZEditor.page.background_color,
            'background-image':'url(' + ZEditor.page.background_image + ')',
        });
    },
    melBaseUpdate:function(){
        if (ZEditor.curMel == null) return;
        ZEditor.curMel.attr('style', $('#attr_style').val());
        ZEditor.curMel.css({
            top:$('#attr_css_top').val() + 'px',
            left:$('#attr_css_left').val() + 'px',
            width:$('#attr_css_width').val() + 'px',
            height:$('#attr_css_height').val() + 'px',
        });
    },
    addMel:function(mel){
        mel.attr('id', 'mel_' + ZEditor.work.melIndex++);
        
        $('#divDraw').append(mel);

        if (mel.find('.edit-bar').length > 0)
        {
            mel.myDrag({
                handler: '.edit-bar',
                parent: $('#divDraw'),
            });

            /*
            mel.draggabilly({
                handle: '.edit-bar',
                containment: $('#divDraw'),
                grid: [ 1, 1 ]
            });
            */
        }
        else
        {
            mel.myDrag({
                parent: $('#divDraw'),
            });
            /*
            mel.draggabilly({
                containment: $('#divDraw'),
                grid: [ 1, 1 ]
            });
            */
        }

        mel.click(function(){
            ZEditor.selectMel($(this));
        });

        ZEditor.selectMel(mel);
    },
    btnAddText:function(){
        let mel = $('<div class="mel mel-text" data-mel-type="text">文字01</div>');
        ZEditor.addMel(mel);
    },
    btnAddNumber:function(){
        let mel = $('<div class="mel mel-number" data-mel-type="number">1000</div>');
        ZEditor.addMel(mel);
    },
    btnAddRect:function(){
        let mel = $('<div class="mel mel-rect" data-mel-type="rect"></div>');
        ZEditor.addMel(mel);
    },
    btnAddCircle:function(){
        let mel = $('<div class="mel mel-circle" data-mel-type="circle"></div>');
        ZEditor.addMel(mel);
    },
    btnAddImage:function(){
        let imgSrc = window.prompt('输入图片路径：', '../img/img01.png');
        if (!imgSrc) return;
        let mel = $('<img class="mel mel-image" data-mel-type="image" src="' + imgSrc + '" />');
        ZEditor.addMel(mel);
    },
    btnAddIcon:function(){
        let mel = $('<div class="mel mel-icon" data-mel-type="icon"><i class="fa fa-home"></i></div>');
        ZEditor.addMel(mel);
    },
    btnAddIFrame:function(){
        let frameSrc = window.prompt('输入网址：', 'https://cn.bing.com');
        if (!frameSrc) return;
        let mel = $('<div class="mel mel-iframe" data-mel-type="iframe"><div class="edit-bar"></div><iframe src="' + frameSrc + '" frameborder="no" border="0"marginwidth="0" marginheight="0" scrolling="no"allowtransparency="yes" /></div>');
        ZEditor.addMel(mel);
    },
    btnAddTable:function(){
        let html = '<div class="mel mel-table" data-mel-type="table"><div class="edit-bar"></div>';
        html += '<table contenteditable="true">';
        html += '<thead>';
        html += '<tr>';
        html += '<th>th1</th>';
        html += '<th>th2</th>';
        html += '<th>th3</th>';
        html += '<th>th4</th>';
        html += '<th>th5</th>';
        html += '</tr>';
        html += '</thead>';
        html += '<tbody>';
        html += '<tr>';
        html += '<td>td1</td>';
        html += '<td>td1</td>';
        html += '<td>td1</td>';
        html += '<td>td1</td>';
        html += '<td>td1</td>';
        html += '</tr>';
        html += '</tbody>';
        html += '</table>';
        html += '</div>';
        let mel = $(html);
        ZEditor.addMel(mel);
    },
    btnAddPipe:function(){
        let html = '<div class="mel mel-pipe" data-mel-type="pipe">';
        html += $('#divTemplateSvg').html();
        html += '</div>';

        let mel = $(html);
        ZEditor.addMel(mel);
    },
    btnAddVideo:function(){
        let html = '<div class="mel mel-video" data-mel-type="video">';
        html += '<video src="" controls="controls"></video>';
        html += '</div>';
        let mel = $(html);
        ZEditor.addMel(mel);
    },
    btnAddBar:function(){
        let html = '<div class="mel mel-bar" data-mel-type="bar">';
        html += '<div></div>';
        html += '</div>';
        let mel = $(html);
        ZEditor.addMel(mel);
    },
    btnAddBorder:function(class_name){
        let html = '<div class="mel mel-border ' + class_name + '" data-mel-type="border"></div>';
        let mel = $(html);
        ZEditor.addMel(mel);
    },

    btnAddChart:function(){
        let imgSrc = 'https://quickchart.io/chart?bkg=transparent&w=300&h=200&c={type:%27bar%27,data:{labels:[%27January%27,%27February%27,%27March%27,%27April%27,%20%27May%27],datasets:[{label:%27Dogs%27,data:[50,60,70,180,190]},{label:%27Cats%27,data:[100,200,300,400,500]}]}}';
        let mel = $('<img class="mel mel-chart" data-mel-type="chart" src="' + imgSrc + '" />');
        ZEditor.addMel(mel);
    },
    
    selectMel:function(o){
        if (ZEditor.curMel != null)
        {
            ZEditor.curMel.removeClass('active');
        }
        o.addClass('active');
        ZEditor.curMel = o;
        
        let style = o.attr('style');
        style = style.replace(/;/g, ";\r\n");
        $('#attr_style').val(style);
        $('#attr_css_top').val(o.css('top').replace('px', ''));
        $('#attr_css_left').val(o.css('left').replace('px', ''));
        $('#attr_css_width').val(o.css('width').replace('px', ''));
        $('#attr_css_height').val(o.css('height').replace('px', ''));

        let type = ZEditor.curMel.data('mel-type');

        $('.attr-el').hide();
        $('#divAttr_' + type).show();
        if (ZEditor['elUpdate_' + type])
        {
            ZEditor['elUpdate_' + type]();
        }
    },
    btnDel:function(){
        if (ZEditor.curMel == null) return;
        if (!window.confirm('确认删除吗？')) return;
        ZEditor.curMel.remove();
        ZEditor.curMel = null;
    },
    btnToTop:function(){
        if (ZEditor.curMel == null) return;
        ZEditor.work.zindexMax++;
        ZEditor.curMel.css('z-index', ZEditor.work.zindexMax);
    },
    btnToBottom:function(){
        if (ZEditor.curMel == null) return;
        ZEditor.work.zindexMin--;
        ZEditor.curMel.css('z-index', ZEditor.work.zindexMin);
    },
    btnCopy:function(){
        let html = ZEditor.curMel.prop("outerHTML");
        let mel = $(html);
        mel.css({
            top:Math.round(ZEditor.curMel.position().top + 10) + 'px',
            left:Math.round(ZEditor.curMel.position().left + 10) + 'px',
        });
        //console.log(mel);
        ZEditor.addMel(mel);
    },
    btnSave:function(){
        if (ZEditor.curMel != null)
        {
            ZEditor.curMel.removeClass('active');
        }
        ZEditor.curMel = null;

        let data = {
            work:ZEditor.work,
            page:ZEditor.page,
            html:$('#divDraw').html(),
        }

        localStorage.setItem('data', JSON.stringify(data));
        alert('保存成功');
    },

    // 文本处理
    elUpdate_text:function(){
        if (ZEditor.curMel == null) return;
        if (ZEditor.curMel.data('mel-type') != 'text') return;

        $('#attr_text_css_font_family').val(ZEditor.curMel.css('font-family'));
        $('#attr_text_css_font_size').val(ZEditor.curMel.css('font-size').replace('px', ''));
        $('#attr_text_css_color')[0].jscolor.fromString(ZEditor.curMel.css('color'));
        $('#attr_text_html').val(ZEditor.curMel.html());
        $('#attr_text_css_text_align').val(ZEditor.curMel.css('text-align'));

        $('#attr_text_css_weight')[0].checked = ZEditor.curMel.css('font-weight') == '700';
        $('#attr_text_css_italic')[0].checked = ZEditor.curMel.css('font-style') == 'italic';
    },
    elSave_text:function(){
        if (ZEditor.curMel == null) return;
        if (ZEditor.curMel.data('mel-type') != 'text') return;

        ZEditor.curMel.css({
            'font-family':$('#attr_text_css_font_family').val(),
            'font-size':$('#attr_text_css_font_size').val() + 'px',
            'color':$('#attr_text_css_color').val(),
            'text-align':$('#attr_text_css_text_align').val(),
            'font-weight':$('#attr_text_css_weight')[0].checked ? '700' : 'normal',
            'font-style':$('#attr_text_css_italic')[0].checked ? 'italic' : 'normal',
        });

        ZEditor.curMel.html($('#attr_text_html').val());
    },
    
    // 数字处理
    elUpdate_number:function(){
        if (ZEditor.curMel == null) return;
        if (ZEditor.curMel.data('mel-type') != 'number') return;

        $('#attr_number_css_font_family').val(ZEditor.curMel.css('font-family'));
        $('#attr_number_css_font_size').val(ZEditor.curMel.css('font-size').replace('px', ''));
        $('#attr_number_css_color')[0].jscolor.fromString(ZEditor.curMel.css('color'));
        $('#attr_number_html').val(ZEditor.curMel.html());
        $('#attr_number_css_text_align').val(ZEditor.curMel.css('text-align'));

        $('#attr_number_css_weight')[0].checked = ZEditor.curMel.css('font-weight') == '700';
        $('#attr_number_css_italic')[0].checked = ZEditor.curMel.css('font-style') == 'italic';
        
        $('#attr_number_change_type').val(ZEditor.curMel.attr('attr-change-type') || 'null');
    },
    elSave_number:function(){
        if (ZEditor.curMel == null) return;
        if (ZEditor.curMel.data('mel-type') != 'number') return;

        ZEditor.curMel.css({
            'font-family':$('#attr_number_css_font_family').val(),
            'font-size':$('#attr_number_css_font_size').val() + 'px',
            'color':$('#attr_number_css_color').val(),
            'text-align':$('#attr_number_css_text_align').val(),
            'font-weight':$('#attr_number_css_weight')[0].checked ? '700' : 'normal',
            'font-style':$('#attr_number_css_italic')[0].checked ? 'italic' : 'normal',
        });

        ZEditor.curMel.html($('#attr_number_html').val());

        ZEditor.curMel.attr('attr-change-type', $('#attr_number_change_type').val());
    },
    
    // 方框处理
    elUpdate_rect:function(){
        if (ZEditor.curMel == null) return;
        if (ZEditor.curMel.data('mel-type') != 'rect') return;

        $('#attr_rect_css_radius').val(ZEditor.curMel.css('border-radius').replace('px', ''));
        $('#attr_rect_css_color')[0].jscolor.fromString(ZEditor.curMel.css('background-color'));
    },
    elSave_rect:function(){
        if (ZEditor.curMel == null) return;
        if (ZEditor.curMel.data('mel-type') != 'rect') return;

        ZEditor.curMel.css({
            'border-radius':$('#attr_rect_css_radius').val() + 'px',
            'background-color':$('#attr_rect_css_color').val(),
        });
    },
    
    // 圆形处理
    elUpdate_circle:function(){
        if (ZEditor.curMel == null) return;
        if (ZEditor.curMel.data('mel-type') != 'circle') return;

        $('#attr_circle_css_color')[0].jscolor.fromString(ZEditor.curMel.css('background-color'));
    },
    elSave_circle:function(){
        if (ZEditor.curMel == null) return;
        if (ZEditor.curMel.data('mel-type') != 'circle') return;

        ZEditor.curMel.css({
            'background-color':$('#attr_circle_css_color').val(),
        });
    },
    
    // 图标处理
    elUpdate_icon:function(){
        if (ZEditor.curMel == null) return;
        if (ZEditor.curMel.data('mel-type') != 'icon') return;

        $('#attr_icon_class').val(ZEditor.curMel.find('i').prop('class'));
        $('#attr_icon_css_color')[0].jscolor.fromString(ZEditor.curMel.css('color'));
        $('#attr_icon_css_font_size').val(ZEditor.curMel.css('font-size').replace('px', ''));
    },
    elSave_icon:function(){
        if (ZEditor.curMel == null) return;
        if (ZEditor.curMel.data('mel-type') != 'icon') return;

        ZEditor.curMel.css({
            'color':$('#attr_icon_css_color').val(),
            'font-size':$('#attr_icon_css_font_size').val() + 'px',
        });

        ZEditor.curMel.find('i').attr('class', $('#attr_icon_class').val());
    },
    
    // 柱状图
    elUpdate_bar:function(){
        if (ZEditor.curMel == null) return;
        if (ZEditor.curMel.data('mel-type') != 'bar') return;

        $('#attr_bar_css_background_color')[0].jscolor.fromString(ZEditor.curMel.css('background-color'));
        $('#attr_bar_css_color')[0].jscolor.fromString(ZEditor.curMel.find('div').css('background-color'));
        $('#attr_bar_rotate').val(ZEditor.curMel.attr('attr-transform'));
        $('#attr_bar_value').val(ZEditor.curMel.attr('bind-val')||'50%');
    },
    elSave_bar:function(){
        if (ZEditor.curMel == null) return;
        if (ZEditor.curMel.data('mel-type') != 'bar') return;

        let transform = $('#attr_bar_rotate').val();

        ZEditor.curMel.css({
            'background-color':$('#attr_bar_css_background_color').val(),
            'transform':transform,
        });
        ZEditor.curMel.find('div').css('background-color', $('#attr_bar_css_color').val());
        ZEditor.curMel.attr('attr-transform', transform);
        ZEditor.curMel.attr('bind-val', $('#attr_bar_value').val());
    },
    
    // 管道
    elUpdate_pipe:function(){
        if (ZEditor.curMel == null) return;
        if (ZEditor.curMel.data('mel-type') != 'pipe') return;

        let svgPath = ZEditor.curMel.find('path').eq(0);
        $('#attr_pipe_color')[0].jscolor.fromString(svgPath.attr('stroke'));
        $('#attr_pipe_path').val(svgPath.attr('d'));
        $('#attr_pipe_width').val(svgPath.attr('stroke-width'));

        $('#attr_pipe_run_color')[0].jscolor.fromString(ZEditor.curMel.find('path').eq(1).attr('stroke'));

        $('#attr_pipe_speed').val(ZEditor.curMel.find('path').eq(1).css('animation-duration'));
    },
    elSave_pipe:function(){
        if (ZEditor.curMel == null) return;
        if (ZEditor.curMel.data('mel-type') != 'pipe') return;

        ZEditor.curMel.find('path').eq(0).attr('stroke', $('#attr_pipe_color').val());
        ZEditor.curMel.find('path').attr('d', $('#attr_pipe_path').val());

        let w = parseInt($('#attr_pipe_width').val());
        ZEditor.curMel.find('path').eq(0).attr('stroke-width', w);
        ZEditor.curMel.find('path').eq(1).attr('stroke-width', w - 5);
        ZEditor.curMel.find('path').eq(1).attr('stroke-dasharray', w + ',' + (w+5));

        ZEditor.curMel.find('path').eq(1).attr('stroke', $('#attr_pipe_run_color').val());
        
        ZEditor.curMel.find('path').eq(1).css('animation-duration', $('#attr_pipe_speed').val());
    },

};