<?php

// 系统入口
date_default_timezone_set('PRC');
error_reporting(E_ALL^E_WARNING^E_NOTICE);
set_time_limit(10);


// 设置响应头，告诉浏览器这是SVG图像
header('Content-Type: image/svg+xml');

// 定义SVG的宽度和高度
$size = $_GET['size'] ?? 100;
$color = $_GET['color'] ?? '333';
$color = '#' . $color;

$len = $_GET['len'] ?? 4;
$type = $_GET['type'] ?? 1;

// 开始SVG文档
echo '<?xml version="1.0" encoding="UTF-8"?>';
echo '<svg width="' . $size . '" height="' . $size . '" xmlns="http://www.w3.org/2000/svg">';

switch ($type){
    case 1:
        $list = [];
        $x = $size / 2;
        $y = $size / 2;
        $list[] = $x . ',' . $y;
        $index = 0;
        while ($x > 0 && $x < $size && $y > 0 && $y < $size) {
            $c = floor(($index + 2) / 2);
            switch ($index % 4){
                case 0:
                    $x += $len * $c;
                    break;
                case 1:
                    $y -= $len * $c;
                    break;
                case 2:
                    $x -= $len * $c;
                    break;
                case 3:
                    $y += $len * $c;
                    break;
            }
            $list[] = $x . ',' . $y;
            $index++;
        }
        echo '<polyline points="' . implode(' ', $list) . '" fill="none" stroke="' . $color . '" stroke-width="1" />';
        break;
    case 2:
        $x = $size / 2;
        $y = $size / 2;
        $path = 'M' . $x . ',' . $y . ' ';
        $index = 0;
        while ($x > 0 && $x < $size && $y > 0 && $y < $size) {
            $l = $len * ($index + 1);
            $l2 = $l*0.66;
            if ($index % 2 == 0){
                $path .= 'C' . $x . ',' . ($y+$l2) . ' ' . ($x+$l) . ',' . ($y+$l2) . ' ' . ($x+$l) . ',' . $y . ' ';
                $x = $x + $l;
            }else{
                $path .= 'C' . $x . ',' . ($y-$l2) . ' ' . ($x-$l) . ',' . ($y-$l2) . ' ' . ($x-$l) . ',' . $y . ' ';
                $x = $x - $l;
            }
            $index++;
        }
        echo '<path d="' . $path . '" fill="none" stroke="' . $color . '" stroke-width="1" />';
        break;
    case 3:
        $x = $size / 2;
        $y = $size / 2;
        $list = [];
        $list[] = $x . ',' . $y;
        $r = $len;
        $index = 0;
        $segment = $_GET['segment'] ?? 8;
        while ($x > 0 && $x < $size && $y > 0 && $y < $size) {
            $rad = ($index - 90) * M_PI / 180;
            $x = $size / 2 + $r * cos($rad);
            $y = $size / 2 + $r * sin($rad);
            $list[] = round($x,1) . ',' . round($y,1);
            $r += $len / $segment;
            $index += 360 / $segment;
        }
        echo '<polyline points="' . implode(' ', $list) . '" fill="none" stroke="' . $color . '" stroke-width="1" />';
        break;
}

// 关闭SVG标签
echo '</svg>';