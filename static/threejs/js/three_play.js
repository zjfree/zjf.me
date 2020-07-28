// ThreeJS 查看工具
var ThreePlay = TP = {

    // 版本
    version: '20200210',

    saveData:null,
    isReady:false,
    loadIndex:0,
    baseFont:null,

    // 内部变量
    renderer: null,
    camera: null,
    scene: null,
    stats: null,
    orbit: null,
    raycaster: null,
    tween: null,
    INTERSECTED: null,

    divMain: null,
    meshLine: null,

    targetPosition: null,

    init: function (el) {
        TP.divMain = $('#' + el);

        TP.initRender();
        TP.initScene();
        TP.initCamera();
        TP.initLight();
        TP.initModel();
        TP.initControls();
        TP.initRaycaster();

        requestAnimationFrame(TP.animate);
        window.onresize = TP.onWindowResize;
    },

    //弧度角度换算
    getRad: function (deg) {
        return (Math.PI * deg) / 180;
    },
    getDeg: function (rad) {
        let deg = (rad * 180) / Math.PI;
        deg = deg % 360;
        if (deg < 0) {
            deg += 360;
        }
        return deg;
    },

    initRender: function () {
        TP.renderer = new THREE.WebGLRenderer({ antialias: true });
        TP.renderer.shadowMap.enabled = true;
        TP.renderer.shadowMap.type = THREE.VSMShadowMap;
        TP.renderer.outputEncoding = THREE.sRGBEncoding;

        TP.renderer.setPixelRatio( window.devicePixelRatio );
        
        TP.renderer.setClearColor('#333'); //设置背景颜色
        TP.renderer.setSize(TP.divMain.width(), TP.divMain.height());
        TP.divMain[0].appendChild(TP.renderer.domElement);
    },

    initCamera: function () {
        TP.camera = new THREE.PerspectiveCamera(30, TP.divMain.width() / TP.divMain.height(), 0.1, 1000);
        TP.camera.position.set(0, 20, 60);
    },

    initScene: function () {
        TP.scene = new THREE.Scene();
        TP.scene.fog = new THREE.FogExp2('#ccc', 0.005);
        //scene.fog = new THREE.Fog('#ccc', 20, 100);

        // SKYBOX/FOG
        var skyBoxGeometry = new THREE.CubeGeometry(200, 200, 200);
        var skyBoxMaterial = new THREE.MeshBasicMaterial({ color: '#367EE3', side: THREE.BackSide });
        var skyBox = new THREE.Mesh(skyBoxGeometry, skyBoxMaterial);
        TP.scene.add(skyBox);
    },

    initLight: function () {
        TP.scene.add(new THREE.AmbientLight(0x404040));

        let light = new THREE.DirectionalLight(0xffffff);
        light.position.set(0, 50, 50);
        light.castShadow = true;
        TP.scene.add(light);

        light.shadow.camera.near = 0.5;    // default
        light.shadow.camera.far = 500;     // default
        light.shadow.camera.top = 100;     // default
        light.shadow.camera.right = 100;     // default
        light.shadow.camera.bottom = -100;     // default
        light.shadow.camera.left = -100;     // default
        
        // LIGHT
        light = new THREE.PointLight(0xffffff, 0.3);
        light.position.set(0, 50, -50);
        light.castShadow = false;
        TP.scene.add(light);
    },

    initModel:function(){
        let geometry = new THREE.BoxBufferGeometry( 1, 1, 1 );

        let wireframe = new THREE.WireframeGeometry( geometry );

        TP.meshLine = new THREE.LineSegments( wireframe );
        TP.meshLine.material.depthTest = false;
        TP.meshLine.material.opacity = 0.7;
        TP.meshLine.material.transparent = true;

        TP.scene.add( TP.meshLine );
        TP.meshLine.visible = false;
    },

    // 初始化控制
    initControls: function () {

        TP.orbit = new THREE.OrbitControls(TP.camera, TP.renderer.domElement);

        // 如果使用animate方法时，将此函数删除
        //orbit.addEventListener( 'change', render );
        // 使动画循环使用时阻尼或自转 意思是否有惯性
        TP.orbit.enableDamping = true;
        //动态阻尼系数 就是鼠标拖拽旋转灵敏度
        //orbit.dampingFactor = 0.25;
        //是否可以缩放
        TP.orbit.enableZoom = true;
        //是否自动旋转
        TP.orbit.autoRotate = true;
        TP.orbit.autoRotateSpeed = 0.3;
        //设置相机距离原点的最远距离
        TP.orbit.minDistance = 1;
        //设置相机距离原点的最远距离
        TP.orbit.maxDistance = 150;
        //是否开启右键拖拽
        TP.orbit.enablePan = false;

        TP.orbit.minPolarAngle = 45 * Math.PI / 180;
        TP.orbit.maxPolarAngle = 80 * Math.PI / 180;
    },

    // 初始化鼠标点击
    initRaycaster: function () {
        TP.raycaster = new THREE.Raycaster();
        let mc = new Hammer(TP.divMain[0]);
        mc.on("tap", function (event) {
            console.log(event);
            if (TP.INTERSECTED) {
                TP.targetPosition = TP.INTERSECTED.position.clone();
                TP.animateCamera(TP.orbit.target, TP.targetPosition);
            }
            event.preventDefault();
            let mouse = new THREE.Vector2();
            let objects = [];
            mouse.x = ((event.center.x - 0) / TP.divMain.width()) * 2 - 1;
            mouse.y = - (event.center.y / TP.divMain.height()) * 2 + 1;

            TP.raycaster.setFromCamera(mouse, TP.camera);
            TP.scene.children.forEach(child => {
                if (!child.type) return;
                if (!child.userData.type) return;

                if ($.inArray(child.type, ['Mesh', 'Scene', 'Sprite', 'Group']) != -1) {
                    objects.push(child)
                };
            });

            //var intersects = raycaster.intersectObjects(objects, true);
            var intersects = TP.raycaster.intersectObjects(objects, true);
            console.log(intersects);
            if (intersects.length > 0) {
                let curObj = intersects[0].object;
                while (true) {
                    if (curObj.userData.type) {
                        break;
                    }
                    if (!curObj.parent) {
                        break;
                    }
                    if (!curObj.parent.parent) {
                        break;
                    }
                    curObj = curObj.parent;
                }

                TP.selectObj(curObj);
            }
            else {
                TP.cancelSelect();
            }
            //console.log(targetPosition);
        });
    },

    cancelSelect: function(){
        if (!TP.INTERSECTED) return;

        TP.meshLine.visible = false;
        TP.orbit.autoRotate = TP.saveData['base']['autoRotate'];
        TP.INTERSECTED = null;
    },

    // 选中3D对象
    selectObj: function (obj) {
        if (obj == TP.INTERSECTED) {
            return;
        }

        if (obj.userData['can_select'] === false)
        {
            return;
        }
        
        TP.cancelSelect();

        // 高亮
        TP.INTERSECTED = obj;

        if (obj.geometry)
        {
            TP.meshLine.geometry = new THREE.WireframeGeometry( obj.geometry );
            
            TP.meshLine.position.set(obj.position.x, obj.position.y, obj.position.z);
            TP.meshLine.rotation.set(obj.rotation.x, obj.rotation.y, obj.rotation.z);
            TP.meshLine.scale.set(obj.scale.x, obj.scale.y, obj.scale.z);
            TP.meshLine.visible = true;
        }
        else
        {
            TP.meshLine.geometry = new THREE.BoxBufferGeometry( 1,1,1 );
            
            TP.meshLine.position.set(obj.position.x, obj.position.y, obj.position.z);
            TP.meshLine.rotation.set(0,0,0);
            TP.meshLine.scale.set(1,1,1);
            TP.meshLine.visible = true;
        }
        
        TP.orbit.autoRotate = false;
        
        TP.targetPosition = TP.INTERSECTED.position.clone();
        TP.animateCamera(TP.orbit.target, TP.targetPosition);
    },

    // 渲染、动画
    render: function () {
        TP.renderer.render(TP.scene, TP.camera);
    },

    onWindowResize: function () {
        TP.camera.aspect = TP.divMain.width() / TP.divMain.height();
        TP.camera.updateProjectionMatrix();
        TP.render();
        TP.renderer.setSize(TP.divMain.width(), TP.divMain.height());
    },

    animate: function (time) {
        //更新控制器
        TP.orbit.update();
        TWEEN.update(time);
        TP.render();

        requestAnimationFrame(TP.animate);
    },

    // 3D物体
    addObj: function (geometry, position, color, textureUrl) {
        color = color || '#' + Math.random().toString(16).substr(2, 6).toUpperCase();
        textureUrl = textureUrl || '';

        let material = new THREE.MeshPhongMaterial({ color: color, side: THREE.DoubleSide, shadowSide: THREE.BackSide });
 
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

        TP.scene.add(obj);
        obj.position.set(position.x, position.y, position.z);

        return obj;
    },

    // 添加3D文字
    addText: function (txt, size, height, color, fnCallback) {
        size = size || 3;
        height = height || 1;
        color = color || '#FF0000';
        let loader = new THREE.FontLoader();
        loader.load('../static/threejs/font/helvetiker_regular.typeface.json', function (font) {
            let textOption = {
                size: size, height: height, curveSegments: 10,
                font: font, weight: "normal", style: "normal",
                bevelThickness: 0.1, bevelSize: 0.1, bevelEnabled: false,
                material: 0, extrudeMaterial: 1
            };

            TP.baseFont = font;
            let textGeom = new THREE.TextBufferGeometry(txt, textOption);
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

            TP.scene.add(textMesh);
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
            //group.scale.multiplyScalar(0.05);
            group.position.x = 0;
            group.position.y = 30;
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

                        mesh.scale.multiplyScalar(0.03);
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
                            mesh.scale.multiplyScalar(0.03);
                            group.add(mesh);
                        }
                    }
                }
            }

            TP.scene.add(group);
            if (fnCallback) {
                fnCallback(group);
            }
        });
    },

    // 添加图片
    addImg: function (imgUrl) {
        let spriteMap = new THREE.TextureLoader().load(imgUrl);

        let spriteMaterial = new THREE.SpriteMaterial({ map: spriteMap, color: 0xffffff });

        let sprite = new THREE.Sprite(spriteMaterial);
        sprite.scale.set(1, 1, 1)

        TP.scene.add(sprite);

        return sprite;
    },

    addModel: function (model_name, fnCallback) {
        // 加载 glTF 格式的模型
        let loader = new THREE.GLTFLoader();/*实例化加载器*/
        loader.setPath('../static/threejs/models/');

        loader.load(model_name, function (obj) {
            //console.log(obj);
            let modelObj = obj.scene;
            TP.scene.add(modelObj);
            modelObj.scale.x = 50;
            modelObj.scale.y = 50;
            modelObj.scale.z = 50;
            modelObj.traverse(function (object) {
                if (object.isMesh) {
                    object.castShadow = true;
                    object.receiveShadow = true;
					object.material.metalness = 0.5;
                    //console.log(object);
                }
            });

            if (fnCallback) {
                fnCallback(modelObj);
            }

        }, function (xhr) {
            console.log((xhr.loaded / xhr.total * 100) + '% loaded');
        }, function (error) {
            console.log('load error!', error);
        });

    },

    // 文字标签
    addMarker: function (txt, parameters) {
        if (parameters === undefined) parameters = {};

        let fontface = parameters.hasOwnProperty("fontface") ?
            parameters["fontface"] : "Arial";

        let fontsize = parameters.hasOwnProperty("fontsize") ?
            parameters["fontsize"] : 48;

        let borderThickness = parameters.hasOwnProperty("borderThickness") ?
            parameters["borderThickness"] : 4;

        let borderColor = parameters.hasOwnProperty("borderColor") ?
            parameters["borderColor"] : 'rgba(0,0,0,0.7)';

        let backgroundColor = parameters.hasOwnProperty("backgroundColor") ?
            parameters["backgroundColor"] : 'rgba(255,255,255,0.7)';

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
        let metrics = context.measureText(txt);
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

        context.lineWidth = borderThickness;
        TP.roundRect(context, borderThickness / 2, borderThickness / 2, textWidth + borderThickness, fontsize * 1.4 + borderThickness, 6);
        // 1.4 is extra height factor for text below baseline: g,j,p,q.

        // text color
        context.fillStyle = color;

        context.fillText(txt, borderThickness, fontsize + borderThickness);
        // $('body').append(canvas);

        // canvas contents will be used for a texture
        let texture = new THREE.CanvasTexture(canvas);

        let spriteMaterial = new THREE.SpriteMaterial(
            { map: texture, transparent:true });
        let sprite = new THREE.Sprite(spriteMaterial);
        let zoom = fontsize / 48;
        sprite.scale.set(zoom * canvas.width / canvas.height, zoom, zoom);
        sprite.center.set(0.5, 0);

        TP.scene.add(sprite);

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

    // 添加管道
    addTube:function(radius, radialSegments, color){
        let curve = new THREE.CatmullRomCurve3( [
            new THREE.Vector3( -10, 0, 0 ),
            new THREE.Vector3( 10, 0, 0 ),
        ], false, 'catmullrom', 0.0001 );

        // 可能的值为centripetal、chordal和catmullrom。
        // 当.type为catmullrom时，定义catmullrom的张力。
        curve.arcLengthDivisions = 1;

        let geometry = new THREE.TubeBufferGeometry( curve, curve.points.length * 10, radius||0.5, radialSegments||32 );
        let mesh = TP.addObj(geometry, {x:0,y:20,z:0}, color);
        mesh.userData['geometryParams'] = {
            closed: mesh.geometry.parameters.closed,
            path: mesh.geometry.parameters.path.points,
            radialSegments: mesh.geometry.parameters.radialSegments,
            radius: mesh.geometry.parameters.radius,
            tubularSegments: mesh.geometry.parameters.tubularSegments,
        };

        TP.setTubeBox(mesh);

        return mesh;
    },

    // 相机动画
    animateCamera: function (current1, current2) {

        let positionVar = {
            x1: current1.x,
            y1: current1.y,
            z1: current1.z
        };
        //关闭控制器
        //orbit.enabled = false;
        TP.tween = new TWEEN.Tween(positionVar);
        TP.tween.to({
            x1: current2.x,
            y1: current2.y,
            z1: current2.z
        }, 500);
        //console.log("Tween", tween);

        TP.tween.onUpdate(function () {

            TP.orbit.target.set(positionVar.x1, positionVar.y1, positionVar.z1);
            TP.orbit.update();

            //console.log("Tween", positionVar);
        })

        TP.tween.onComplete(function () {
            ///开启控制器
            //orbit.enabled = true;
        })

        //tween.easing(TWEEN.Easing.Quadratic.Out);
        TP.tween.start();
    },

    load: function (saveData) {
        
        TP.isReady = false;
        TP.loadIndex = 0;
        TP.saveData = saveData;
        console.log(TP.saveData);

        TP.clear();

        // 雾气
        let fog = TP.saveData['base']['fog'];
        TP.scene.fog.color.set(fog.fogColor);
        TP.scene.fog.density = fog.fogDensity;
        
        // 自动旋转
        TP.orbit.autoRotate = TP.saveData['base']['autoRotate'];
        
        // 加载元素
        for (let k in TP.saveData['list']) {
            let obj = TP.saveData['list'][k];
            let mesh = null;
            let geometry = null;
            let geoParam = obj.userData.geometryParams;
            switch (obj.type) {
                case 'Box':
                    geometry = new THREE.BoxBufferGeometry(geoParam.width, geoParam.height, geoParam.depth);
                    geometry.translate(0, geoParam.height / 2, 0);
                    mesh = TP.addObj(geometry, obj.position, obj.userData.materialParams.color, obj.userData.textureUrl);
                    break;
                case 'Marker':
                    mesh = TP.addMarker(obj.userData.markerParams.text, obj.userData.markerParams);
                    break;
                case 'Svg':
                    TP.addSvg(obj.userData.svgUrl, function (svgObj) {
                        TP.setMesh(svgObj, obj);
                    });
                    continue;
                case 'Img':
                    mesh = TP.addImg(obj.userData.imgUrl);
                    break;
                case 'Model':
                    TP.addModel(obj.userData.modelName, function (modelObj) {
                        TP.setMesh(modelObj, obj);
                    });
                    continue;
                case 'Text':
                    TP.addText(obj.userData.text||'', geoParam.size, geoParam.height, obj.userData.materialParams.color, function (txtObj) {
                        TP.setMesh(txtObj, obj);
                    });
                    continue;
                case 'Cone':
                    geometry = new THREE.ConeBufferGeometry(geoParam.radius, geoParam.height, geoParam.radialSegments);
                    geometry.translate(0, geoParam.height / 2, 0);
                    mesh = TP.addObj(geometry, obj.position, obj.userData.materialParams.color, obj.userData.textureUrl);
                    break;
                case 'Cylinder':
                    geometry = new THREE.CylinderBufferGeometry(geoParam.radiusTop, geoParam.radiusBottom, geoParam.height, geoParam.radialSegments);
                    geometry.translate(0, geoParam.height / 2, 0);
                    mesh = TP.addObj(geometry, obj.position, obj.userData.materialParams.color, obj.userData.textureUrl);
                    break;
                case 'Dodecahedron':
                    geometry = new THREE.DodecahedronBufferGeometry(geoParam.radius, geoParam.detail);
                    mesh = TP.addObj(geometry, obj.position, obj.userData.materialParams.color, obj.userData.textureUrl);
                    break;
                case 'Icosahedron':
                    geometry = new THREE.IcosahedronBufferGeometry(geoParam.radius, geoParam.detail);
                    mesh = TP.addObj(geometry, obj.position, obj.userData.materialParams.color, obj.userData.textureUrl);
                    break;
                case 'Octahedron':
                    geometry = new THREE.OctahedronBufferGeometry(geoParam.radius, geoParam.detail);
                    mesh = TP.addObj(geometry, obj.position, obj.userData.materialParams.color, obj.userData.textureUrl);
                    break;
                case 'Ring':
                    geometry = new THREE.RingBufferGeometry(geoParam.innerRadius, geoParam.outerRadius, geoParam.thetaSegments);
                    mesh = TP.addObj(geometry, obj.position, obj.userData.materialParams.color, obj.userData.textureUrl);
                    break;
                case 'Sphere':
                    geometry = new THREE.SphereBufferGeometry(geoParam.radius, geoParam.widthSegments, geoParam.heightSegments);
                    mesh = TP.addObj(geometry, obj.position, obj.userData.materialParams.color, obj.userData.textureUrl);
                    break;
                case 'Tetrahedron':
                    geometry = new THREE.TetrahedronBufferGeometry(geoParam.radius, geoParam.detail);
                    mesh = TP.addObj(geometry, obj.position, obj.userData.materialParams.color, obj.userData.textureUrl);
                    break;
                case 'Torus':
                    geometry = new THREE.TorusBufferGeometry(geoParam.radius, geoParam.tube, geoParam.radialSegments, geoParam.tubularSegments, geoParam.arc);
                    mesh = TP.addObj(geometry, obj.position, obj.userData.materialParams.color, obj.userData.textureUrl);
                    break;
                case 'Tube':
                    let pointList = [];
                    for (let k in geoParam.path)
                    {
                        let p = geoParam.path[k];
                        pointList.push(new THREE.Vector3( p.x, p.y, p.z ))
                    }
                    let curve = new THREE.CatmullRomCurve3( pointList, false, 'catmullrom', 0.0001 );
                    curve.arcLengthDivisions = 1;
                    geometry = new THREE.TubeBufferGeometry(curve, curve.points.length * 10, geoParam.radius, geoParam.radialSegments, geoParam.closed);
                    mesh = TP.addObj(geometry, obj.position, obj.userData.materialParams.color, obj.userData.textureUrl);
                    TP.setMesh(mesh, obj);
                    continue;
            }

            TP.setMesh(mesh, obj);
        }
    },

    setMesh: function (mesh, obj) {
        if (!mesh) return;

        mesh.position.set(obj.position.x, obj.position.y, obj.position.z);
        mesh.rotation.set(obj.rotation.x, obj.rotation.y, obj.rotation.z);
        mesh.scale.set(obj.scale.x, obj.scale.y, obj.scale.z);
        mesh.userData = obj.userData;
    
        mesh.castShadow = obj.castShadow;
        mesh.receiveShadow = obj.receiveShadow;

        if (mesh.type != 'Group' && mesh.material && obj.userData.materialParams) {
            mesh.material.color.set(obj.userData.materialParams.color);
            mesh.material.bumpScale = obj.userData.materialParams.bumpScale;
            mesh.material.shininess = obj.userData.materialParams.shininess;
            mesh.material.opacity = obj.userData.materialParams.opacity;
            if (obj.type != 'Marker' && obj.type != 'Img')
            {
                mesh.material.transparent = mesh.material.opacity < 1;
            }
            else
            {
                mesh.material.transparent = true;
            }

            if ('textureUrl' in obj.userData) {
                if (obj.userData.textureUrl == '') {
                    mesh.material.map.repeat.set(0, 0);
                }
                else {
                    mesh.material.map.repeat.set(obj.userData.textureRepeatX, obj.userData.textureRepeatY);
                }
            }
        }

        TP.parseKeyList(mesh);

        TP.loadIndex++;
        TP.showInfo('加载中... (' + TP.loadIndex + '/' + TP.saveData.list.length + ')');
        if (TP.loadIndex == TP.saveData.list.length)
        {
            TP.isReady = true;
            TP.showInfo('');
        }
    },

    clear: function () {

        for (let i = 0; i < TP.scene.children.length; i++) {
            let obj = TP.scene.children[i];
            if (obj.userData['type']) {
                TP.scene.remove(obj);
                i--;
            }
        }

        TP.INTERSECTED = null;
    },

    // 移动到指定点
    moveTo: function(position){
        TP.cancelSelect();
        TP.targetPosition = position;
        TP.animateCamera(TP.orbit.target, TP.targetPosition);
    },

    // 显示信息
    showInfo:function(str, color){
        color = color || '#000';
        $('#divInfo').html(str).css('color', color);
    },

    // 解析KEY列表
    parseKeyList:function(mesh)
    {
        mesh.userData['bind_key'] = {};
        mesh.userData['bind_key_all'] = [];
        for (let k in mesh.userData['bind'])
        {
            let v = mesh.userData['bind'][k];

            let keyList = [];
    
            // 获取key列表
            let start = -1;
            for (let p=0; p<v.length; p++)
            {
                if (v.substr(p, 2) == '{$')
                {
                    start = p;
                    continue;
                }
    
                if (v.substr(p, 1) == '}')
                {
                    if (start != -1)
                    {
                        let key = v.substr(start+2, p - start - 2);
                        keyList.push(key);
                        mesh.userData['bind_key_all'].push(key);
                    }
                    start = -1;
                }
            }

            mesh.userData['bind_key'][k] = {
                keyList:keyList,
                value:v,
            };
        }

        if ('visible' in mesh.userData['bind']){
            mesh.visible = false;
        }
    },

    // 解析值
    bindData:function(item)
    {
        if (!TP.isReady) return;

        let delList = [];
        let count = TP.scene.children.length;
        for (let kk = 0; kk < count; kk++) {
            let obj = TP.scene.children[kk];
            if (!obj.userData['type'])  continue;

            for (let k in obj.userData['bind_key'])
            {
                let value = TP.parseValue(obj.userData['bind_key'][k], item);
                if (!value) continue;

                switch (k)
                {
                    case 'name':
                        obj.name = value;
                        break;
                    case 'visible':
                        obj.visible = parseInt(value) == 1;
                        break;
                    case 'color':
                        if (obj.material && (obj.material instanceof THREE.MeshPhongMaterial)) {
                            obj.material.color.set(value);
                        }
                        break;
                    case 'positionX':
                        obj.position.x = parseFloat(value);
                        break;
                    case 'positionY':
                        obj.position.y = parseFloat(value);
                        break;
                    case 'positionZ':
                        obj.position.z = parseFloat(value);
                        break;
                    case 'rotationX':
                        obj.rotation.x = TP.getRad(parseFloat(value));
                        break;
                    case 'rotationY':
                        obj.rotation.y = TP.getRad(parseFloat(value));
                        break;
                    case 'rotationZ':
                        obj.rotation.z = TP.getRad(parseFloat(value));
                        break;
                    case 'scaleX':
                        obj.scale.x = parseFloat(value);
                        break;
                    case 'scaleY':
                        obj.scale.y = parseFloat(value);
                        break;
                    case 'scaleZ':
                        obj.scale.z = parseFloat(value);
                        break;
                    case 'opacity':
                        if (obj.material) {
                            obj.material.opacity = value;
                            obj.material.transparent = value != 1;
                        }
                        break;
                    case 'can_select':
                        obj.userData['can_select'] = parseInt(value) == 1;
                        break;
                    case 'value':
                        switch (obj.userData['type'])
                        {
                            case 'Marker':
                                value = ' ' + $.trim(value) + ' ';
                                if (obj.userData['markerParams']['text'] == value)
                                {
                                    break;
                                }

                                obj.userData['markerParams']['text'] = value;

                                let objMarker = TP.addMarker(value, obj.userData.markerParams);
                                                            
                                objMarker.position.set(obj.position.x, obj.position.y, obj.position.z);
                                objMarker.rotation.set(obj.rotation.x, obj.rotation.y, obj.rotation.z);
                                objMarker.userData = obj.userData;
                            
                                objMarker.castShadow = obj.castShadow;
                                objMarker.receiveShadow = obj.receiveShadow;

                                delList.push(obj);
                                break;
                            case 'Text':
								value = '' + value;
                                if (obj.userData['text'] == value)
                                {
                                    break;
                                }

                                obj.userData['text'] = value;
                                let geoParam = obj.userData.geometryParams;

                                let textOption = {
                                    size: geoParam.size, height: geoParam.height, curveSegments: 10,
                                    font: TP.baseFont, weight: "normal", style: "normal",
                                    bevelThickness: 0.1, bevelSize: 0.1, bevelEnabled: false,
                                    material: 0, extrudeMaterial: 1
                                };
                    
                                obj.geometry = new THREE.TextBufferGeometry(value, textOption);

                                break;
                        }
                        break;
                }
            }
        }

        for (let k in delList)
        {
            TP.scene.remove(delList[k]);
        }
    },
    

    // 解析值
    parseValue:function(bind, item)
    {
        let value = bind.value;
        if (value.indexOf('{$') == -1)
        {
            return value;
        }

        for (let k of bind.keyList)
        {
            if (k in item)
            {
                value = value.replace(new RegExp('\\{\\$' + k + '\\}','g'), item[k]);
            }
        }
        
        if (value.indexOf('{$') != -1)
        {
            return null;
        }
        
        try{
            value = eval(value);
        }catch(err){
            console.error(err);
        }

        // console.log(value);

        return value;
    },
    
	formatDate:function(d){
        d = d || new Date();

        let f = (v) => ('0' + v).substr(-2);
        return d.getFullYear() + '-'
            + f(d.getMonth() + 1) + '-'
            + f(d.getDate()) + ' '
            + f(d.getHours()) + ':'
            + f(d.getMinutes()) + ':'
            + f(d.getSeconds());
    },
};

