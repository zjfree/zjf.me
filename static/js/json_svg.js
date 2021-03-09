/*
==========================
JSON_SVG json格式绘图标记
==========================

目标：
1. 简单高效，实用
2. 结构清晰，层次分明
3. 性能优先
4. 动态尺寸
5. DOCK
6. 坐标系转换
7. 鼠标位置响应

*/

var point = {
    x:1, // 像素、百分比、表达式（鼠标、毫秒值）
    y:1,
    dock:{
        x1:0,
        y1:0,
        x2:0,
        y2:0,
    },
};

var stroke = {
    color:'',
    cap:'',
    join:'',
    width:1,
    miterLimit:10,
    dash:[1,5],
    uid:'',
};

var json_svg = {

    // 基础属性
    base:{
        width:100,
        height:100,
        csys:'',    // 坐标系
    },

    // 层级
    layer:[
        {
            rotate:0,
            opacity:1,
            rect:{x:0, y:0, w:100, h:100},
            fill:'fill_color',
            dock:{},
            visible:true,
            max_order:0,
            list:[
                {id:1, order:0, type:'point', point:{x:1,y:1}, fill:'red'},
                {id:2, order:0, type:'circle', point:{x:1,y:1}, radius:12, fill:'red', stroke:{color:'red',}},
                {id:3, order:0, type:'rect', rect:{}, fill:'red', stroke:{color:'red',}, radius:5},
                {id:4, order:0, type:'img', img:'', rotate:0, opacity:1, rect:{}, from_rect:{}, shadow:{}},
                {id:5, order:0, type:'clear', rect:{}},
                {id:2, order:0, type:'line', point1:{x:1,y:1}, point2:{x:1,y:1}, stroke:{color:'red',}},
                {id:2, order:0, type:'lines', list:[], stroke:{color:'red',}},
                {id:2, order:0, type:'ellipse', point:{x:1,y:1}, stroke:{color:'red',}, fill:{}},
                {id:2, order:0, type:'arc', point:{x:1,y:1}, stroke:{color:'red',}, fill:{}},
                {id:2, order:0, type:'text', point:{x:1,y:1}, stroke:{color:'red',}, fill:{}},
                {id:2, order:0, type:'curve', point:{x:1,y:1}, stroke:{color:'red',}, fill:{}},
                {id:2, order:0, type:'path', path:'Path2D', stroke:{color:'red',}, fill:{}},
            ]
        },
    ],

    // 元素模板
    def:[
        {name:'d1', width:100, height:100, list:[]},
    ],

    // 资源
    resource:[
        {name:'img_1',type:'img',src:''},
        {name:'sk_1',type:'stroke'},
        {name:'fill_1',type:'fill'},
        {name:'sd_1',type:'shadow'},
        {name:'path_1',type:'path'},
    ],
}