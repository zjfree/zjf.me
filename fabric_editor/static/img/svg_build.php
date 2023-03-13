<?php

$dir = '.\svg';
$list = [];

foreach(glob($dir . '\*') as $d)
{
    if(is_dir($d))
    {
        $item =[
            'name' => basename($d),
            'd' => $d,
        ];

        $file_list = [];
        foreach(glob($d . '\*') as $f)
        {
            $new_file = str_replace(' ', '_', $f);
            $new_file = str_replace('(', '_', $new_file);
            $new_file = str_replace(')', '_', $new_file);
            $new_file = str_replace('-', '_', $new_file);
            rename($f, $new_file);
            $file_list[] = basename($new_file);
        }
        $item['list'] = $file_list;
        
        $list[] = $item;
    }
}

$json = json_encode($list, 384);

file_put_contents('svg.json', $json);
echo $json;