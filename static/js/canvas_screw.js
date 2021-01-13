
var ZTool = {
	strInfo:'',
	strInfoTimer:null,
	fpsList:[],
	rand:function(min, max, dec)
	{
		dec = dec||0;
		let val = min + Math.random() * (max - min);
		return Math.round(val * Math.pow(10, dec)) / Math.pow(10, dec);
	},
	randColor:function(alpha, ext)
	{
		ext = ext||'50%,50%';
		if (alpha)
		{
			return 'hsla(' + this.rand(0, 360) + ',' + ext + ',' + (this.rand(0, 100) / 100) + ')';
		}
		else
		{
			return 'hsl(' + this.rand(0, 360) + ',' + ext + ')';
		}
	},
	showInfo:function(str)
	{
		if (!this.strInfoTimer)
		{
			this.strInfoTimer = window.setInterval(function(){
				if (ZTool.strInfo == '') return;
				$('#divInfo').html(ZTool.strInfo);
				ZTool.strInfo = '';
			}, 100);
		}

		this.strInfo = str;
	},
	fps:function()
	{
		let now = Date.now();
		this.fpsList.push(now);
		while (now - this.fpsList[0] > 1000)
		{
			this.fpsList.shift();
		}
		this.showInfo('fps:' + this.fpsList.length);
	}
};

var CC = {
	width:0,
	height:0,
	size:1,
	ctx:null,
	index:0,
	isPlay:true,
	call_fn:null,
	init:function(el, fn)
	{
		this.call_fn = fn;
		this.width = el.width() * window.devicePixelRatio;
		this.height = el.height() * window.devicePixelRatio;
		this.size = Math.min(this.width,this.height) / 100;
		el.prop('width', this.width);
		el.prop('height', this.height);
		this.ctx = el[0].getContext("2d");

		this.ctx.translate(this.width / 2, this.height / 2);
		this.ctx.scale(1, -1);

		this.clear();
		
		window.requestAnimationFrame(function(){
			CC.render();
		});
	},
	stop:function()
	{
		this.isPlay = false;
	},
	play:function()
	{
		this.isPlay = true;
	},
	render:function()
	{
		if (!this.isPlay)
		{
			window.requestAnimationFrame(function(){
				CC.render();
			});

			return;
		}

		// 计算FPS
		ZTool.fps();

		this.index++;
		if (this.call_fn)
		{
			this.call_fn(this.index);
		}
		
		window.requestAnimationFrame(function(){
			CC.render();
		});
	},
	clear:function(){
		let s = Math.max(this.width,this.height) * 2;
		this.ctx.clearRect(-s,-s,s*2,s*2);
	},
	drawRect:function(x,y,w,h, fillStyle, strokeStyle, deg)
	{
		deg = deg||0;
		deg = deg*Math.PI/180;

		let centerX = Math.round(x+w/2);
		let centerY = Math.round(y+h/2);

		if (deg != 0)
		{
			this.ctx.save();
			this.ctx.translate(centerX, centerY);
			this.ctx.rotate(deg);
			this.ctx.translate(-centerX, -centerY);
		}

		fillStyle = fillStyle||'#ddd';

		this.ctx.beginPath();
		this.ctx.rect(x,y,w,h);
		this.ctx.closePath();

		if (fillStyle)
		{
			this.ctx.fillStyle = fillStyle;
			this.ctx.fill();
		}
		if (strokeStyle)
		{
			this.ctx.strokeStyle = strokeStyle;
			this.ctx.stroke();
		}

		if (deg != 0)
		{
			this.ctx.restore();
		}
	},
	drawCirle:function(x,y,r, fillStyle, strokeStyle)
	{
		fillStyle = fillStyle||'#ddd';

		this.ctx.beginPath();
		this.ctx.arc(x,y,r,0,2*Math.PI);
		this.ctx.closePath();

		if (fillStyle)
		{
			this.ctx.fillStyle = fillStyle;
			this.ctx.fill();
		}
		if (strokeStyle)
		{
			this.ctx.strokeStyle = strokeStyle;
			this.ctx.stroke();
		}

	},
	drawLine:function(x1,y1,x2,y2,strokeStyle,lineWidth)
	{
		lineWidth = lineWidth || 1;
		strokeStyle = strokeStyle||'#f00';

		this.ctx.beginPath();
		this.ctx.moveTo(x1, y1);
		this.ctx.lineTo(x2, y2);
		
		this.ctx.lineWidth = lineWidth;
		this.ctx.strokeStyle = strokeStyle;
		this.ctx.stroke();
	},
	drawText:function(x1,y1,str,fillStyle,font)
	{
		this.ctx.scale(1, -1);
		y1 = -y1;

		this.ctx.font = font||"16px Verdana";
		this.ctx.fillStyle = fillStyle||'#fff';
		this.ctx.fillText(str, x1, y1);

		this.ctx.scale(1, -1);
	},
};

// 获取中心点
function pointCenter(p1, p2)
{
	let p = {
		x: (p2.x + p1.x) / 2,
		y: (p2.y + p1.y) / 2,
	};

	return p;
}

// 在指定角度移动距离
function goDeg(p1, deg, len)
{
	deg = deg * Math.PI / 180;
	let p2 = {
		x:p1.x + Math.cos(deg) * len,
		y:p1.y + Math.sin(deg) * len,
	};
	
	return p2;
}

// 两点间距离
function getDist(p1, p2)
{
	let c1 = p1.x - p2.x;
	let c2 = p1.y - p2.y;
	let len = Math.sqrt(c1*c1+c2*c2);
	
	return len;
}

// 两点间角度
function getDeg(p1, p2)
{
	deg = Math.atan2(p2.y-p1.y,p2.x-p1.x) / (Math.PI / 180);

	return deg;
}
