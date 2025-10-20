<?php

// 系统入口
date_default_timezone_set('PRC');
error_reporting(E_ALL^E_WARNING^E_NOTICE);
set_time_limit(10);


// 设置响应头，告诉浏览器这是SVG图像
header('Content-Type: image/svg+xml');

// 定义SVG的宽度和高度
$wlen = $_GET['w'] ?? 10;
$hlen = $_GET['h'] ?? 10;
$rgb = $_GET['rgb'] ?? '0,0,255';
$type = $_GET['type'] ?? 0;

$size = 16;
$padding = 4;

$width = $size * $wlen + $padding * ($wlen+1);
$height = $size * $hlen + $padding * ($hlen+1);

// 开始SVG文档
echo '<?xml version="1.0" encoding="UTF-8"?>';
echo '<svg width="' . $width . '" height="' . $height . '" xmlns="http://www.w3.org/2000/svg">';

for ($x=0; $x<$wlen; $x++) {
    for ($y=0; $y<$hlen; $y++) {
        $xPos = $x * ($size + $padding) + $padding;
        $yPos = $y * ($size + $padding) + $padding;
        $color = 'rgba(' . $rgb . ',' . rand(20,80) / 100 . ')';
        $second1 = round(rand(2000,10000) / 1000, 2);
        $second2 = round(rand(0,3000) / 1000, 2);
        switch ($type){
            case 1:
                echo "<rect x=\"$xPos\" y=\"$yPos\" width=\"$size\" height=\"$size\" stroke=\"$color\" stroke-width=\"" . $padding/2 . "\" fill=\"none\">";
                break;
            case 2:
                echo "<rect x=\"$xPos\" y=\"$yPos\" width=\"$size\" height=\"$size\" stroke=\"$color\" stroke-width=\"" . $padding/2 . "\" fill=\"none\" rx=\"" . $size / 4 . "\" ry=\"" . $size / 4 . "\">";
                break;
            case 3:
                echo "<rect x=\"$xPos\" y=\"$yPos\" width=\"$size\" height=\"$size\" stroke=\"$color\" stroke-width=\"" . $padding/2 . "\" fill=\"none\" rx=\"" . $size / 2 . "\" ry=\"" . $size / 2 . "\">";
                break;
            case 4:
                echo "<rect x=\"$xPos\" y=\"$yPos\" width=\"$size\" height=\"$size\" fill=\"$color\" rx=\"" . $size / 4 . "\" ry=\"" . $size / 4 . "\">";
                break;
            case 5:
                echo "<rect x=\"$xPos\" y=\"$yPos\" width=\"$size\" height=\"$size\" fill=\"$color\" rx=\"" . $size / 2 . "\" ry=\"" . $size / 2 . "\">";
                break;
            default:
                echo "<rect x=\"$xPos\" y=\"$yPos\" width=\"$size\" height=\"$size\" fill=\"$color\">";
                break;
        }
        echo '<animate attributeName="opacity" values="1;0;1" dur="' . $second1 . 's" repeatCount="indefinite" begin="' . $second2 . 'ms"/>';
        echo '</rect>';
    }
}

// 关闭SVG标签
echo '</svg>';