// ThreeJS编辑器
var ThreeEditor = TE = {

    // 内部变量
    renderer: null,
    camera: null,
    scene: null,
    stats: null,
    orbit: null,
    transformControl: null,
    gui: null,
    raycaster: null,
    tween: null,
    INTERSECTED: null,

    divMain: null,

    isMove: null,
    isMouseDown: false,
    mouseMoveIndex: 0,
    targetPosition: null,

    init: function (el) {
        TE.divMain = $('#' + el);

        TE.initRender();
        TE.initScene();
        TE.initCamera();
        TE.initLight();
        TE.initModel();
        TE.initControls();
        TE.initStats();
        TE.initGui();
        TE.initRaycaster();

        requestAnimationFrame(TE.animate);
        window.onresize = TE.onWindowResize;
    },

    initRender: function () {
        TE.renderer = new THREE.WebGLRenderer({ antialias: true });
        TE.renderer.shadowMap.enabled = true;
        TE.renderer.shadowMap.type = THREE.VSMShadowMap;
        TE.renderer.outputEncoding = THREE.sRGBEncoding;

        /*
        BasicShadowMap 能够给出没有经过过滤的阴影映射 —— 速度最快，但质量最差。
        PCFShadowMap 为默认值，使用Percentage-Closer Filtering (PCF)算法来过滤阴影映射。
        PCFSoftShadowMap 使用Percentage-Closer Soft Shadows (PCSS)算法来过滤阴影映射。
        VSMShadowMap 使用Variance Shadow Map (VSM)算法来过滤阴影映射。当使用VSMShadowMap时，所有阴影接收者也将会投射阴影。
        */


        //renderer.physicallyCorrectLights = true;
        //renderer.outputEncoding = THREE.sRGBEncoding;
        //renderer.shadowMap.enabled = true;
        //renderer.toneMapping = THREE.ReinhardToneMapping;
        //renderer.setPixelRatio( window.devicePixelRatio );

        TE.renderer.setClearColor('#333'); //设置背景颜色
        TE.renderer.setSize(TE.divMain.width(), TE.divMain.height());
        TE.divMain[0].appendChild(TE.renderer.domElement);
    },

    initCamera: function () {
        TE.camera = new THREE.PerspectiveCamera(50, TE.divMain.width() / TE.divMain.height(), 0.1, 1000);
        TE.camera.position.set(0, 20, 20);
    },

    initScene: function () {
        TE.scene = new THREE.Scene();
        TE.scene.fog = new THREE.FogExp2('#ccc', 0.01);
        //scene.fog = new THREE.Fog('#ccc', 20, 100);

        /*
        // SKYBOX/FOG
        var skyBoxGeometry = new THREE.CubeGeometry( 10000, 10000, 10000 );
        var skyBoxMaterial = new THREE.MeshBasicMaterial( { color: 0x9999ff, side: THREE.BackSide } );
        var skyBox = new THREE.Mesh( skyBoxGeometry, skyBoxMaterial );
        scene.add(skyBox);
        */

        // 坐标轴辅助
        let axes = new THREE.AxesHelper(50);
        TE.scene.add(axes);

        // 网格
        let gridHelper = new THREE.GridHelper(100, 100);
        TE.scene.add(gridHelper);
    },

    initLight: function () {
        TE.scene.add(new THREE.AmbientLight(0x404040));

        let light = new THREE.DirectionalLight(0xffffff);
        light.position.set(0, 50, 50);
        light.castShadow = true;
        //light.shadowCameraVisible = true;
        TE.scene.add(light);
        let helper = new THREE.DirectionalLightHelper(light, 5);
        TE.scene.add(helper);

        light.shadow.camera.near = 0.5;    // default
        light.shadow.camera.far = 500;     // default
        light.shadow.camera.top = 100;     // default
        light.shadow.camera.right = 100;     // default
        light.shadow.camera.bottom = -100;     // default
        light.shadow.camera.left = -100;     // default
        //console.log(light.shadow.camera);

        //addObj(new THREE.DodecahedronGeometry(1, 2), {x:0,y:50,z:50}, 'red');

        // LIGHT
        light = new THREE.PointLight(0xffffff);
        light.position.set(0, 50, -50);
        //light.castShadow = true;
        //light.shadowCameraVisible = true;
        TE.scene.add(light);

        let pointLightHelper = new THREE.PointLightHelper(light, 1);
        TE.scene.add(pointLightHelper);
    },

    initModel: function () {

        // 一个立方体
        TE.addObj(new THREE.BoxBufferGeometry(50, 0.4, 50), { x: 0, y: 0.2, z: 0 }, '#363', '../static/threejs/texture/texture02.jpg');

        let i = 0;
        for (let x = -20; x <= 20; x += 5) {
            for (let y = -20; y <= 20; y += 5) {
                let h = 3 + Math.random() * 10;
                let geometry = new THREE.BoxBufferGeometry(4, h, 4);
                geometry.translate(0, h / 2, 0);

                TE.addObj(geometry, { x: x, y: 0, z: y }, null, '../static/threejs/texture/texture01.jpg');

                i++;
                let spritey = TE.markerText(" #" + i + "号 ");
                spritey.position.set(x, h, y);
                TE.scene.add(spritey);
            }
        }

        TE.addText('Hello World!');

        TE.addSvg('../static/threejs/models/svg/threejs.svg');
    },

    // 初始化Stats
    initStats: function () {
        TE.stats = new Stats();
        TE.stats.dom.style.position = 'absolute';
        TE.stats.dom.style.left = '0px';
        TE.stats.dom.style.top = '0px';
        TE.divMain[0].appendChild(TE.stats.dom);
    },

    // 初始化控制
    initControls: function () {

        TE.orbit = new THREE.OrbitControls(TE.camera, TE.renderer.domElement);

        // 如果使用animate方法时，将此函数删除
        //orbit.addEventListener( 'change', render );
        // 使动画循环使用时阻尼或自转 意思是否有惯性
        TE.orbit.enableDamping = true;
        //动态阻尼系数 就是鼠标拖拽旋转灵敏度
        //orbit.dampingFactor = 0.25;
        //是否可以缩放
        TE.orbit.enableZoom = true;
        //是否自动旋转
        TE.orbit.autoRotate = false;
        //设置相机距离原点的最远距离
        TE.orbit.minDistance = 1;
        //设置相机距离原点的最远距离
        TE.orbit.maxDistance = 100;
        //是否开启右键拖拽
        TE.orbit.enablePan = false;

        TE.orbit.minPolarAngle = 45 * Math.PI / 180;
        TE.orbit.maxPolarAngle = 80 * Math.PI / 180;

        // 变换控制
        TE.transformControl = new THREE.TransformControls(TE.camera, TE.renderer.domElement);
        TE.transformControl.size = 1;
        TE.transformControl.addEventListener('change', TE.render);
        TE.transformControl.addEventListener('dragging-changed', function (event) {
            TE.orbit.enabled = !event.value;
        });
        TE.scene.add(TE.transformControl);

        // Hiding transform situation is a little in a mess :()
        TE.transformControl.addEventListener('change', function () {
        });

        TE.transformControl.addEventListener('mouseDown', function () {
            isMove = true;
        });

        TE.transformControl.addEventListener('mouseUp', function () {
            isMove = false;
        });

        TE.transformControl.addEventListener('objectChange', function () {
            if (!TE.INTERSECTED) return;

            TE.gui.positionX = TE.INTERSECTED.position.x;
            TE.gui.positionY = TE.INTERSECTED.position.y;
            TE.gui.positionZ = TE.INTERSECTED.position.z;
            TE.gui.rotationX = TE.INTERSECTED.rotation._x * 180 / Math.PI;
            TE.gui.rotationY = TE.INTERSECTED.rotation._y * 180 / Math.PI;
            TE.gui.rotationZ = TE.INTERSECTED.rotation._z * 180 / Math.PI;
            TE.gui.scaleX = TE.INTERSECTED.scale.x;
            TE.gui.scaleY = TE.INTERSECTED.scale.y;
            TE.gui.scaleZ = TE.INTERSECTED.scale.z;
            TE.gui.scale = Math.min(TE.INTERSECTED.scale.x, TE.INTERSECTED.scale.y, TE.INTERSECTED.scale.z);
        });

        // 快捷键
        window.addEventListener('keydown', function (event) {
            switch (event.keyCode) {

                case 81: // Q
                    TE.transformControl.setSpace(TE.transformControl.space === "local" ? "world" : "local");
                    break;

                case 16: // Shift
                    TE.transformControl.setTranslationSnap(100);
                    TE.transformControl.setRotationSnap(THREE.Math.degToRad(15));
                    TE.transformControl.setScaleSnap(0.25);
                    break;

                case 87: // W
                    TE.transformControl.setMode("translate");
                    TE.gui.opModel = 'translate';
                    break;

                case 69: // E
                    TE.transformControl.setMode("rotate");
                    TE.gui.opModel = 'rotate';
                    break;

                case 82: // R
                    TE.transformControl.setMode("scale");
                    TE.gui.opModel = 'scale';
                    break;
                case 88: // X
                    TE.gui.opX = TE.transformControl.showX = !TE.transformControl.showX;
                    break;

                case 89: // Y
                    TE.gui.opY = TE.transformControl.showY = !TE.transformControl.showY;
                    break;

                case 90: // Z
                    TE.gui.opZ = TE.transformControl.showZ = !TE.transformControl.showZ;
                    break;

                case 32: // Spacebar
                    TE.gui.opEnabled = TE.transformControl.enabled = !TE.transformControl.enabled;
                    break;
            }
        });

        window.addEventListener('keyup', function (event) {
            switch (event.keyCode) {

                case 17: // Ctrl
                    TE.transformControl.setTranslationSnap(null);
                    TE.transformControl.setRotationSnap(null);
                    TE.transformControl.setScaleSnap(null);
                    break;
            }
        });
    },

    // 初始化自定义参数
    initGui: function () {
        //声明一个保存需求修改的相关数据的对象
        TE.gui = {
            isFog: true,
            fogColor: '#ccc',
            fogDensity: 0.01,

            curColor: '#fff',

            opEnabled: true,
            opModel: 'translate',  // translate  rotate  scale
            opX: true,
            opY: true,
            opZ: true,

            positionX: 1,
            positionY: 1,
            positionZ: 1,

            rotationX: 0,
            rotationY: 0,
            rotationZ: 0,

            scale: 1,
            scaleX: 1,
            scaleY: 1,
            scaleZ: 1,

            textureUrl: '',
            textureRepeatX: 3,
            textureRepeatY: 3,

            bumpScale: 0.2,
            shininess: 30,
            opacity:1,

            // 拷贝
            copy: function () {
                if (!TE.INTERSECTED) {
                    return;
                }

                let obj = null;
                if (TE.INTERSECTED.type != 'Mesh') {
                    obj = TE.INTERSECTED.clone();
                    TE.scene.add(obj);
                    TE.selectObj(obj);
                    return;
                }

                let geometry = TE.INTERSECTED.geometry.clone();
                let material = null;
                if (TE.INTERSECTED.material instanceof Array) {
                    material = [];
                    for (let k in TE.INTERSECTED.material) {
                        material.push(TE.INTERSECTED.material[k].clone());
                    }
                }
                else if (TE.INTERSECTED.material) {
                    material = TE.INTERSECTED.material.clone();
                }
                obj = new THREE.Mesh(geometry, material);
                obj.castShadow = true;
                obj.receiveShadow = true;

                obj.userData = TE.INTERSECTED.userData;

                TE.scene.add(obj);
                obj.position.set(TE.INTERSECTED.position.x + 2, TE.INTERSECTED.position.y, TE.INTERSECTED.position.z);

                if (TE.INTERSECTED.material && (TE.INTERSECTED.material instanceof THREE.MeshPhongMaterial)) {
                    obj.material.emissive.setHex(TE.INTERSECTED.currentHex);
                }
                TE.selectObj(obj);
            },

            // 删除
            del: function () {
                if (!TE.INTERSECTED) {
                    return;
                }

                TE.scene.remove(TE.INTERSECTED);
                TE.INTERSECTED = null;
                TE.transformControl.detach(TE.transformControl.object);
            },
        };
        var datGui = new dat.GUI();
        //将设置属性添加到gui当中，gui.add(对象，属性，最小值，最大值）
        var f1 = datGui.addFolder('基础');
        f1.add(TE.gui, 'isFog').name('雾气').onChange(function (value) {
            if (value) {
                TE.scene.fog = new THREE.FogExp2(TE.gui.fogColor, TE.gui.fogDensity);
            }
            else {
                TE.scene.fog = null;
            }
        });
        f1.addColor(TE.gui, 'fogColor').name('雾气颜色').onChange(function (value) {
            if (TE.gui.isFog) {
                TE.scene.fog = new THREE.FogExp2(value, TE.gui.fogDensity);
            }
        });
        f1.add(TE.gui, 'fogDensity', 0, 0.1).name('雾气强度').onChange(function (value) {
            if (TE.gui.isFog) {
                TE.scene.fog = new THREE.FogExp2(value, TE.gui.fogDensity);
            }
        });

        //f1.open();

        var f2 = datGui.addFolder('选中项');
        f2.add(TE.gui, 'opEnabled').listen().name('操作启用').onChange(function (value) {
            TE.transformControl.enabled = value;
        });
        let modelType = {
            移动: 'translate',
            旋转: 'rotate',
            缩放: 'scale',
        };
        f2.add(TE.gui, 'opModel', modelType).listen().name('操作模式').onChange(function (value) {
            TE.transformControl.setMode(value);
        });
        f2.add(TE.gui, 'opX').listen().name('X轴启用').onChange(function (value) {
            TE.transformControl.showX = value;
        });
        f2.add(TE.gui, 'opY').listen().name('Y轴启用').onChange(function (value) {
            TE.transformControl.showY = value;
        });
        f2.add(TE.gui, 'opZ').listen().name('Z轴启用').onChange(function (value) {
            TE.transformControl.showY = value;
        });

        // 颜色
        f2.addColor(TE.gui, 'curColor').listen().name('颜色').onChange(function (value) {
            if (TE.INTERSECTED && TE.INTERSECTED.material && (TE.INTERSECTED.material instanceof THREE.MeshPhongMaterial)) {
                TE.INTERSECTED.material.color.set(value);
            }
        });

        // 位置
        let positionFn = function (value) {
            if (!TE.INTERSECTED) return;
            TE.INTERSECTED.position.set(TE.gui.positionX, TE.gui.positionY, TE.gui.positionZ);
        };
        f2.add(TE.gui, 'positionX').listen().name('位置X').onChange(positionFn);
        f2.add(TE.gui, 'positionY').listen().name('位置Y').onChange(positionFn);
        f2.add(TE.gui, 'positionZ').listen().name('位置Z').onChange(positionFn);

        // 角度
        let rotationFn = function (value) {
            if (!TE.INTERSECTED) return;
            TE.INTERSECTED.rotation.set(TE.gui.rotationX * Math.PI / 180, TE.gui.rotationY * Math.PI / 180, TE.gui.rotationZ * Math.PI / 180, 'XYZ');
        };
        f2.add(TE.gui, 'rotationX', 0, 360, 5).listen().name('旋转X').onChange(rotationFn);
        f2.add(TE.gui, 'rotationY', 0, 360, 5).listen().name('旋转Y').onChange(rotationFn);
        f2.add(TE.gui, 'rotationZ', 0, 360, 5).listen().name('旋转Z').onChange(rotationFn);

        // 缩放
        f2.add(TE.gui, 'scale', 0).listen().name('缩放').onChange(function (value) {
            if (!TE.INTERSECTED) return;
            TE.gui.scaleX = TE.gui.scaleY = TE.gui.scaleZ = value;
            TE.INTERSECTED.scale.set(value, value, value);
        });
        let scaleFn = function (value) {
            if (!TE.INTERSECTED) return;
            TE.INTERSECTED.scale.set(TE.gui.scaleX, TE.gui.scaleY, TE.gui.scaleZ);
        };
        f2.add(TE.gui, 'scaleX', 0).listen().name('缩放X').onChange(scaleFn);
        f2.add(TE.gui, 'scaleY', 0).listen().name('缩放Y').onChange(scaleFn);
        f2.add(TE.gui, 'scaleZ', 0).listen().name('缩放Z').onChange(scaleFn);

        // 材质
        let textureType = {
            empty: '',
            texture01: '../static/threejs/texture/texture01.jpg',
            texture02: '../static/threejs/texture/texture02.jpg',
            texture03: '../static/threejs/texture/texture03.jpg',
        };
        f2.add(TE.gui, 'textureUrl', textureType).listen().name('材质图片').onChange(function (value) {
            if (!TE.INTERSECTED) return;
            if (value == '') {
                if (TE.INTERSECTED.material.map) {
                    TE.INTERSECTED.material.map.repeat.set(0, 0);
                }
                TE.INTERSECTED.userData['textureRepeatX'] = 0;
                TE.INTERSECTED.userData['textureRepeatY'] = 0;
            }
            else {
                var texture = new THREE.TextureLoader().load(value);
                texture.wrapS = THREE.RepeatWrapping;
                texture.wrapT = THREE.RepeatWrapping;
                texture.repeat.set(TE.gui.textureRepeatX, TE.gui.textureRepeatY);

                TE.INTERSECTED.material.map = texture;
                TE.INTERSECTED.material.bumpMap = texture;
            }
            TE.INTERSECTED.userData['textureUrl'] = value;
        });
        f2.add(TE.gui, 'textureRepeatX').listen().name('材质缩放X').onChange(function (value) {
            if (!TE.INTERSECTED) return;
            if (TE.INTERSECTED.material.map) {
                if (TE.gui.textureUrl == '') {
                    TE.INTERSECTED.material.map.repeat.set(0, 0);
                }
                else {
                    TE.INTERSECTED.material.map.repeat.set(TE.gui.textureRepeatX, TE.gui.textureRepeatY);
                }
            }
            TE.INTERSECTED.userData['textureRepeatX'] = value;
        });
        f2.add(TE.gui, 'textureRepeatY').listen().name('材质缩放Y').onChange(function (value) {
            if (!TE.INTERSECTED) return;
            if (TE.INTERSECTED.material.map) {
                if (TE.gui.textureUrl == '') {
                    TE.INTERSECTED.material.map.repeat.set(0, 0);
                }
                else {
                    TE.INTERSECTED.material.map.repeat.set(TE.gui.textureRepeatX, TE.gui.textureRepeatY);
                }
            }
            TE.INTERSECTED.userData['textureRepeatY'] = value;
        });

        // 材质凹凸
        f2.add(TE.gui, 'bumpScale', 0, 1).listen().name('材质凹凸').onChange(function (value) {
            if (!TE.INTERSECTED || !TE.INTERSECTED.material) return;
            TE.INTERSECTED.material.bumpScale = value;
        });

        // 高亮
        f2.add(TE.gui, 'shininess', 0, 100).listen().name('高亮').onChange(function (value) {
            if (!TE.INTERSECTED || !TE.INTERSECTED.material) return;
            TE.INTERSECTED.material.shininess = value;
        });

        // 透明
        f2.add(TE.gui, 'opacity', 0, 1).listen().name('透明度').onChange(function (value) {
            if (!TE.INTERSECTED || !TE.INTERSECTED.material) return;
            TE.INTERSECTED.material.opacity = value;
            TE.INTERSECTED.material.transparent = value != 1;
        });

        // 3D对象操作
        f2.add(TE.gui, 'copy').name('复制3D对象');
        f2.add(TE.gui, 'del').name('删除3D对象');
    },

    // 初始化鼠标点击
    initRaycaster: function () {
        TE.raycaster = new THREE.Raycaster();
        TE.divMain.on("mousedown", function (event) {
            if (TE.isMove) return;
            TE.isMouseDown = true;
            TE.mouseMoveIndex = 0;
        });
        $(document).on("mousemove", function (event) {
            TE.isMouseDown = TE.mouseMoveIndex++ == 0;
        });
        TE.divMain.on("mouseup", function (event) {
            if (TE.INTERSECTED) {
                TE.targetPosition = TE.INTERSECTED.position.clone();
                TE.animateCamera(TE.orbit.target, TE.targetPosition);
            }
            if (!TE.isMouseDown) return;
            TE.isMouseDown = false;
            event.preventDefault();
            let mouse = new THREE.Vector2();
            let objects = [];
            mouse.x = ((event.clientX - 0) / TE.divMain.width()) * 2 - 1;
            mouse.y = - (event.clientY / TE.divMain.height()) * 2 + 1;

            TE.raycaster.setFromCamera(mouse, TE.camera);
            TE.scene.children.forEach(child => {
                if (!child.type) return;
                
                if ($.inArray(child.type, ['Mesh', 'Scene', 'Sprite', 'Group']) != -1) {
                    objects.push(child)
                };
            });

            //var intersects = raycaster.intersectObjects(objects, true);
            var intersects = TE.raycaster.intersectObjects(objects, true);
            console.log(intersects);
            if (intersects.length > 0) {
                let curObj = intersects[0].object;
                while (true) {
                    if (!curObj.parent) {
                        break;
                    }
                    if (!curObj.parent.parent) {
                        break;
                    }
                    curObj = curObj.parent;
                }

                TE.selectObj(curObj);
            }
            else {
                if (TE.INTERSECTED) {
                    if (TE.INTERSECTED.material && (TE.INTERSECTED.material instanceof THREE.MeshPhongMaterial)) {
                        TE.INTERSECTED.material.emissive.setHex(TE.INTERSECTED.currentHex);
                    }
                }

                TE.INTERSECTED = null;
                TE.transformControl.detach(TE.transformControl.object);
            }
            //console.log(targetPosition);
        });
    },

    // 选中3D对象
    selectObj: function (obj) {
        if (obj == TE.INTERSECTED) {
            return;
        }

        if (TE.INTERSECTED) {
            if (TE.INTERSECTED.material && (TE.INTERSECTED.material instanceof THREE.MeshPhongMaterial)) {
                TE.INTERSECTED.material.emissive.setHex(TE.INTERSECTED.currentHex);
            }
        }

        // 高亮
        TE.INTERSECTED = obj;
        if (TE.INTERSECTED.material && (TE.INTERSECTED.material instanceof THREE.MeshPhongMaterial)) {
            console.log(TE.INTERSECTED.material);
            TE.gui.curColor = '#' + TE.INTERSECTED.material.color.getHexString();
        }
        TE.gui.positionX = TE.INTERSECTED.position.x;
        TE.gui.positionY = TE.INTERSECTED.position.y;
        TE.gui.positionZ = TE.INTERSECTED.position.z;
        TE.gui.rotationX = TE.INTERSECTED.rotation._x * 180 / Math.PI;
        TE.gui.rotationY = TE.INTERSECTED.rotation._y * 180 / Math.PI;
        TE.gui.rotationZ = TE.INTERSECTED.rotation._z * 180 / Math.PI;
        TE.gui.scaleX = TE.INTERSECTED.scale.x;
        TE.gui.scaleY = TE.INTERSECTED.scale.y;
        TE.gui.scaleZ = TE.INTERSECTED.scale.z;
        TE.gui.scale = Math.min(TE.INTERSECTED.scale.x, TE.INTERSECTED.scale.y, TE.INTERSECTED.scale.z);

        TE.gui.textureUrl = TE.INTERSECTED.userData['textureUrl'];
        TE.gui.textureRepeatX = TE.INTERSECTED.userData['textureRepeatX'];
        TE.gui.textureRepeatY = TE.INTERSECTED.userData['textureRepeatY'];

        //console.log(INTERSECTED);
        if (TE.INTERSECTED.material && (TE.INTERSECTED.material instanceof THREE.MeshPhongMaterial)) {
            TE.INTERSECTED.currentHex = TE.INTERSECTED.material.emissive.getHex();
            TE.INTERSECTED.material.emissive.setHex(0x333333);
            TE.gui.bumpScale = TE.INTERSECTED.material.bumpScale;
            TE.gui.shininess = TE.INTERSECTED.material.shininess;
        }
        if (TE.INTERSECTED.material){
            TE.gui.opacity = TE.INTERSECTED.material.opacity;
        }
        TE.transformControl.attach(TE.INTERSECTED);
        TE.targetPosition = TE.INTERSECTED.position.clone();
        TE.animateCamera(TE.orbit.target, TE.targetPosition);
    },

    // 渲染、动画
    render: function () {
        TE.renderer.render(TE.scene, TE.camera);
    },

    onWindowResize: function () {
        TE.camera.aspect = TE.divMain.width() / TE.divMain.height();
        TE.camera.updateProjectionMatrix();
        TE.render();
        TE.renderer.setSize(TE.divMain.width(), TE.divMain.height());
    },

    animate: function (time) {
        //更新控制器
        TE.orbit.update();
        TWEEN.update(time);
        TE.render();

        //更新性能插件
        TE.stats.update();
        requestAnimationFrame(TE.animate);
    },

    // 3D物体
    addObj: function (geometry, position, color, textureUrl) {
        color = color || Math.random() * 0XFFFFFF;
        textureUrl = textureUrl || '';

        //let material = new THREE.MeshPhysicalMaterial( { color: color, side: THREE.DoubleSide, shadowSide: THREE.BackSide } );
        //let material = new THREE.MeshBasicMaterial( { color: color, side: THREE.DoubleSide, shadowSide: THREE.BackSide } );
        //let material = new THREE.MeshLambertMaterial( { color: color, side: THREE.DoubleSide, shadowSide: THREE.BackSide } );
        let material = new THREE.MeshPhongMaterial({ color: color, side: THREE.DoubleSide, shadowSide: THREE.BackSide });
        //let material = new THREE.MeshStandardMaterial( { color: color, side: THREE.DoubleSide, shadowSide: THREE.BackSide } );

        // 纹理
        let texture = null;
        if (textureUrl) {
            texture = new THREE.TextureLoader().load(textureUrl);
            texture.repeat.set(3, 3);
        }
        else {
            texture = new THREE.TextureLoader().load('../static/threejs/texture/texture01.jpg');
            texture.repeat.set(0, 0);
        }

        texture.wrapS = THREE.RepeatWrapping;
        texture.wrapT = THREE.RepeatWrapping;

        material.map = texture;
        material.bumpMap = texture;
        material.bumpScale = 0.2;

        let obj = new THREE.Mesh(geometry, material);
        obj.castShadow = true;
        obj.receiveShadow = true;

        obj.userData['textureUrl'] = textureUrl;
        obj.userData['textureRepeatX'] = 3;
        obj.userData['textureRepeatY'] = 3;

        TE.scene.add(obj);
        obj.position.set(position.x, position.y, position.z);

        /*
        // 添加外框
        var outlineMaterial1 = new THREE.MeshBasicMaterial( { color: 0x0000ff, side: THREE.BackSide } );
        var outlineMesh1 = new THREE.Mesh( geometry, outlineMaterial1 );
        // outlineMesh1.position = position;
        outlineMesh1.scale.multiplyScalar(1.03);
        scene.add( outlineMesh1 );
        objList.push(outlineMesh1);
        outlineMesh1.position.set(position.x,position.y,position.z);
        */

        return obj;
    },

    // 添加3D文字
    addText: function (txt, size, height, color, fnCallback) {
        size = size || 3;
        height = height || 1;
        color = color || '#ff0000';
        let loader = new THREE.FontLoader();
        loader.load('../static/threejs/font/helvetiker_regular.typeface.json', function (font) {
            let textGeom = new THREE.TextBufferGeometry(txt,
                {
                    size: size, height: height, curveSegments: 10,
                    font: font, weight: "normal", style: "normal",
                    bevelThickness: 0.1, bevelSize: 0.1, bevelEnabled: false,
                    material: 0, extrudeMaterial: 1
                });
            // font: helvetiker, gentilis, droid sans, droid serif, optimer
            // weight: normal, bold

            let material = new THREE.MeshPhongMaterial({ color: color, side: THREE.DoubleSide, shadowSide: THREE.BackSide, flatShading: true });

            let texture = new THREE.TextureLoader().load('../static/threejs/texture/texture01.jpg');
            texture.wrapS = THREE.RepeatWrapping;
            texture.wrapT = THREE.RepeatWrapping;
            texture.repeat.set(0, 0);

            material.map = texture;
            material.bumpMap = texture;
            material.bumpScale = 0.2;

            let textMesh = new THREE.Mesh(textGeom, material);
            textMesh.castShadow = true;
            textMesh.receiveShadow = true;

            textGeom.computeBoundingBox();
            let textWidth = textGeom.boundingBox.max.x - textGeom.boundingBox.min.x;

            textMesh.position.set(-0.5 * textWidth, 20, 0);
            //textMesh.rotation.x = -Math.PI / 4;

            textMesh.userData['textureUrl'] = '';
            textMesh.userData['textureRepeatX'] = 3;
            textMesh.userData['textureRepeatY'] = 3;

            TE.scene.add(textMesh);
            if (fnCallback) {
                fnCallback(textMesh);
            }
        });
    },

    // 添加SVG
    addSvg: function (svgUrl, fnCallback) {
        let loader = new THREE.SVGLoader();
        loader.load(svgUrl, function (data) {

            let paths = data.paths;

            let group = new THREE.Group();
            group.scale.multiplyScalar(0.05);
            group.position.x = -14;
            group.position.y = 14 + 30;
            group.scale.y *= - 1;

            for (let i = 0; i < paths.length; i++) {

                let path = paths[i];

                let fillColor = path.userData.style.fill;
                if (fillColor !== undefined && fillColor !== 'none') {

                    let material = new THREE.MeshBasicMaterial({
                        color: new THREE.Color().setStyle(fillColor),
                        opacity: path.userData.style.fillOpacity,
                        transparent: path.userData.style.fillOpacity < 1,
                        side: THREE.DoubleSide,
                        depthWrite: false,
                        wireframe: false,
                    });

                    let shapes = path.toShapes(true);

                    for (let j = 0; j < shapes.length; j++) {

                        let shape = shapes[j];
                        let geometry = new THREE.ShapeBufferGeometry(shape);
                        let mesh = new THREE.Mesh(geometry, material);
                        mesh.castShadow = true;
                        //mesh.receiveShadow = true;

                        group.add(mesh);
                    }

                }

                let strokeColor = path.userData.style.stroke;
                if (strokeColor !== undefined && strokeColor !== 'none') {

                    let material = new THREE.MeshBasicMaterial({
                        color: new THREE.Color().setStyle(strokeColor),
                        opacity: path.userData.style.strokeOpacity,
                        transparent: path.userData.style.strokeOpacity < 1,
                        side: THREE.DoubleSide,
                        depthWrite: false,
                        wireframe: false,
                    });

                    for (let j = 0, jl = path.subPaths.length; j < jl; j++) {
                        let subPath = path.subPaths[j];
                        let geometry = THREE.SVGLoader.pointsToStroke(subPath.getPoints(), path.userData.style);
                        if (geometry) {
                            let mesh = new THREE.Mesh(geometry, material);
                            mesh.castShadow = true;
                            group.add(mesh);
                        }
                    }
                }
            }

            TE.scene.add(group);
            if (fnCallback)
            {
                fnCallback(group);
            }
        });
    },

    saveScene: function () {
        let sceneJson = scene.toJSON();
        localStorage.setItem('scene', JSON.stringify(sceneJson));

        console.log(sceneJson);
    },

    loadScene: function () {
        let json = localStorage.getItem("scene");

        if (json) {
            let sceneJson = JSON.parse(json);
            let loader = new THREE.ObjectLoader();

            console.log(sceneJson);

            let result = loader.parse(sceneJson);
            console.log(result);

            while (scene.children.length > 0) {

                var child = TE.scene.children.pop();
                TE.cmdArray.push(new AddObjectCommand(TE.editor, child));

            }
        }
    },

    loadModel: function () {
        // 加载 glTF 格式的模型
        let loader = new THREE.GLTFLoader();/*实例化加载器*/
        loader.setPath('../static/threejs/models/');
        /*
        var dracoLoader = new THREE.DRACOLoader();
        dracoLoader.setDecoderPath( '../static/threejs/js/libs/draco/' );
        loader.setDRACOLoader( dracoLoader );
        */

        loader.load('tree03.glb', function (obj) {
            //console.log(obj);
            obj.scene.position.y = 10;
            TE.scene.add(obj.scene);
            obj.scene.scale.x = 50;
            obj.scene.scale.y = 50;
            obj.scene.scale.z = 50;
            obj.scene.traverse(function (object) {
                if (object.isMesh) {
                    object.castShadow = true;
                    object.receiveShadow = true;
                    //console.log(object);
                }
            });

            TE.selectObj(obj.scene);

        }, function (xhr) {
            console.log((xhr.loaded / xhr.total * 100) + '% loaded');
        }, function (error) {
            console.log('load error!', error);
        });

    },

    // 文字标签
    markerText: function (message, parameters) {
        if (parameters === undefined) parameters = {};

        let fontface = parameters.hasOwnProperty("fontface") ?
            parameters["fontface"] : "Arial";

        let fontsize = parameters.hasOwnProperty("fontsize") ?
            parameters["fontsize"] : 36;

        let borderThickness = parameters.hasOwnProperty("borderThickness") ?
            parameters["borderThickness"] : 4;

        let borderColor = parameters.hasOwnProperty("borderColor") ?
            parameters["borderColor"] : 'rgba(0,0,0,0.5)';

        let backgroundColor = parameters.hasOwnProperty("backgroundColor") ?
            parameters["backgroundColor"] : 'rgba(255,255,255,0.5)';

        let color = parameters.hasOwnProperty("color") ?
            parameters["color"] : '#000';

        //var spriteAlignment = THREE.SpriteAlignment.topLeft;
        let spriteAlignment = null;

        let canvas = document.createElement('canvas');
        canvas.width = 100;
        canvas.height = 50;
        let context = canvas.getContext('2d');
        context.font = "Bold " + fontsize + "px " + fontface;

        // get size data (height depends only on font size)
        let metrics = context.measureText(message);
        let textWidth = metrics.width;

        // 重新设置宽度
        canvas = document.createElement('canvas');
        canvas.width = textWidth + borderThickness + 6;
        canvas.height = fontsize * 1.4 + borderThickness + 6;
        context = canvas.getContext('2d');
        context.font = "Bold " + fontsize + "px " + fontface;

        // background color
        context.fillStyle = backgroundColor;
        // border color
        context.strokeStyle = borderColor;

        console.log(backgroundColor, borderColor);

        context.lineWidth = borderThickness;
        TE.roundRect(context, borderThickness / 2, borderThickness / 2, textWidth + borderThickness, fontsize * 1.4 + borderThickness, 6);
        // 1.4 is extra height factor for text below baseline: g,j,p,q.

        // text color
        context.fillStyle = color;

        context.fillText(message, borderThickness, fontsize + borderThickness);
        // $('body').append(canvas);

        // canvas contents will be used for a texture
        let texture = new THREE.CanvasTexture(canvas);

        let spriteMaterial = new THREE.SpriteMaterial(
            { map: texture });
        let sprite = new THREE.Sprite(spriteMaterial);
        sprite.scale.set(1 * canvas.width / canvas.height, 1, 1);
        sprite.center.set(0.5, 0);
        return sprite;
    },

    // function for drawing rounded rectangles
    roundRect: function (ctx, x, y, w, h, r) {
        ctx.beginPath();
        ctx.moveTo(x + r, y);
        ctx.lineTo(x + w - r, y);
        ctx.quadraticCurveTo(x + w, y, x + w, y + r);
        ctx.lineTo(x + w, y + h - r);
        ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
        ctx.lineTo(x + r, y + h);
        ctx.quadraticCurveTo(x, y + h, x, y + h - r);
        ctx.lineTo(x, y + r);
        ctx.quadraticCurveTo(x, y, x + r, y);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
    },

    animateCamera: function (current1, current2) {

        let positionVar = {
            x1: current1.x,
            y1: current1.y,
            z1: current1.z
        };
        //关闭控制器
        //orbit.enabled = false;
        TE.tween = new TWEEN.Tween(positionVar);
        TE.tween.to({
            x1: current2.x,
            y1: current2.y,
            z1: current2.z
        }, 500);
        //console.log("Tween", tween);

        TE.tween.onUpdate(function () {

            TE.orbit.target.set(positionVar.x1, positionVar.y1, positionVar.z1);
            TE.orbit.update();

            //console.log("Tween", positionVar);
        })

        TE.tween.onComplete(function () {
            ///开启控制器
            //orbit.enabled = true;
        })

        //tween.easing(TWEEN.Easing.Quadratic.Out);
        TE.tween.start();
    },

    // 添加3D
    add: function (type) {
        let geometry = null;
        let arr = [];
        switch (type) {
            case 'BoxBufferGeometry':
                arr = TE.parseNum(window.prompt('立方体 (X,Y,Z)', '1,1,1'));
                if (arr === null) return;
                geometry = new THREE.BoxBufferGeometry(arr[0], arr[1], arr[2]);
                geometry.translate(0, arr[1] / 2, 0);
                break;
            case 'ConeGeometry':
                arr = TE.parseNum(window.prompt('圆锥形 (半径，高度，分隔)', '1,1,32'));
                if (arr === null) return;
                geometry = new THREE.ConeBufferGeometry(arr[0], arr[1], arr[2]);
                geometry.translate(0, arr[1] / 2, 0);
                break;
            case 'CylinderGeometry':
                arr = TE.parseNum(window.prompt('圆柱体 (顶半径，底半径，高度，分隔)', '1,1,3,32'));
                if (arr === null) return;
                geometry = new THREE.CylinderBufferGeometry(arr[0], arr[1], arr[2], arr[3]);
                geometry.translate(0, arr[2] / 2, 0);
                break;
            case 'DodecahedronGeometry':
                arr = TE.parseNum(window.prompt('12面体 (半径，顶数)', '1,2'));
                if (arr === null) return;
                geometry = new THREE.DodecahedronBufferGeometry(arr[0], arr[1]);
                break;
            case 'IcosahedronGeometry':
                arr = TE.parseNum(window.prompt('20面体 (半径，顶数)', '1,0'));
                if (arr === null) return;
                geometry = new THREE.IcosahedronBufferGeometry(arr[0], arr[1]);
                break;
            case 'OctahedronGeometry':
                arr = TE.parseNum(window.prompt('八面几何体 (半径，顶数)', '1,0'));
                if (arr === null) return;
                geometry = new THREE.OctahedronBufferGeometry(arr[0], arr[1]);
                break;
            case 'RingGeometry':
                arr = TE.parseNum(window.prompt('圆环平面体 (内部半径，外部半径，圆环的分段数)', '1,2,32'));
                if (arr === null) return;
                geometry = new THREE.RingBufferGeometry(arr[0], arr[1], arr[2]);
                break;
            case 'SphereGeometry':
                arr = TE.parseNum(window.prompt('球几何体 (半径，水平分隔，竖直分隔)', '2,16,16'));
                if (arr === null) return;
                geometry = new THREE.SphereBufferGeometry(arr[0], arr[1], arr[2]);
                break;
            case 'TetrahedronGeometry':
                arr = TE.parseNum(window.prompt('四面体 (半径，顶点数)', '2,0'));
                if (arr === null) return;
                geometry = new THREE.TetrahedronBufferGeometry(arr[0], arr[1]);
                break;
            case 'TorusGeometry':
                arr = TE.parseNum(window.prompt('圆环几何体 (圆环的半径，管道半径，圆环的分段数，管道的分段数，圆环的中心角)', '5,1,32,32,360'));
                if (arr === null) return;
                arr[4] = arr[4] * Math.PI / 180;
                geometry = new THREE.TorusBufferGeometry(arr[0], arr[1], arr[2], arr[3], arr[4]);
                break;
            case 'Text':
                let s1 = window.prompt('文本 (大小，厚度，颜色|文本)', '3,1,#ff0000|Hello');
                if (s1 === null || s1.length < 2) return;
                s1 = s1.split('|');
                arr = TE.parseNum(s1[0]);
                TE.addText(s1[1], arr[0], arr[1], arr[2], function (txtObj) {
                    TE.selectObj(txtObj);
                });
                return;
            case 'Marker':
                let s2 = window.prompt('标签 (大小，颜色|文本)', '36,#ff0000|Hello');
                if (s2 === null || s2.length < 2) return;
                s2 = s2.split('|');
                arr = TE.parseNum(s2[0]);
                let markerOption = {
                    fontsize: arr[0],
                    color: arr[1],
                };
                let spritey = TE.markerText(s2[1], markerOption);
                spritey.position.set(0, 15, 0);
                TE.scene.add(spritey);
                TE.selectObj(obj);
                return;
            case 'Svg':
                let svgUrl = window.prompt('SVG图片 (图片URL)', '');
                if (!svgUrl) return;
                TE.addSvg(svgUrl, function (svgObj) {
                    TE.selectObj(svgObj);
                });
                break;
        }

        if (geometry) {
            let obj = TE.addObj(geometry, { x: 0, y: 10, z: 0 }, '#F00');
            TE.selectObj(obj);
        }
    },

    // 转换数字
    parseNum: function (str) {
        if (str === null) return null;
        let arr = str.split(',');
        let aa = [];
        for (let k in arr) {
            if (arr[k].indexOf('#') === 0) {
                aa.push(arr[k]);
            }
            else {
                aa.push(parseFloat(arr[k]));
            }
        }

        return aa;
    },
};

