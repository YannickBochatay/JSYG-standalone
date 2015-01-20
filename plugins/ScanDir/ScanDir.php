<?php

if (!isset($_SERVER['HTTP_REFERER']) || strpos($_SERVER['HTTP_REFERER'],'http://'.$_SERVER['SERVER_NAME']) === false) {
	//die ('Vous n\'�tes pas autoris� � �x�cuter ce script hors de son contexte');	
}

error_reporting(E_ALL ^ E_NOTICE ^ E_WARNING);

$params = array('path','sort','way','filterType','filterName');

foreach($params as $param)
{
	if (!isset($_GET[$param])) exit;
	$$param = $_GET[$param];	
}

$path = $_SERVER['DOCUMENT_ROOT'] . str_replace(
	array('http://'.$_SERVER['SERVER_NAME'] , ':'.$_SERVER['SERVER_PORT'],$_SERVER['DOCUMENT_ROOT']),
	'',
	$path
);

if (!is_dir($path)) {
	if (is_file($path)) $path = substr($path,0,strrpos($path,'/'));
	else die('[]');
}

$dir = opendir($path);

while ($ligne = readdir($dir)) $rep[] = $ligne;

function name_asc($a,$b) {return strtolower($a)>strtolower($b); }
function name_desc($a,$b) {return strtolower($a)<strtolower($b); }

function date_asc($a,$b) {
	global $path;
	return filemtime("$path/$a")>filemtime("$path/$b");
}
function date_desc($a,$b) {
	global $path;
	return filemtime("$path/$a")<filemtime("$path/$b");
}

function size_asc($a,$b) {
	global $path;
	return filesize("$path/$a")>filesize("$path/$b");
}
function size_desc($a,$b) {
	global $path;
	return filesize("$path/$a")<filesize("$path/$b");
}

usort($rep, $sort.'_'.$way);

if (function_exists('finfo_open')) {
	$finfo = finfo_open(FILEINFO_MIME_TYPE); // Retourne le type mime � la extension mimetype
} else {
	if (function_exists('mime_content_type')) $mime_content_type = true;
	$finfo = false;
}


$dirs = array();
$files = array();


foreach ($rep as $ligne)
{
	$fic = $path."/".$ligne;
	
	$is_dir = is_dir($fic);
	$is_file = !$is_dir && is_file($fic);
	
	if ($is_file && $filterName && !preg_match($filterName,$ligne)) continue;
	
	$elmt = new StdClass();
	
	if ($finfo) $mimetype = finfo_file($finfo,$fic);
	else if ($mime_content_type) $mimetype = mime_content_type($fic);
	else $mimetype = null;
	
	if ($is_file && $mimetype && $filterType && !preg_match($filterType,$mimetype)) continue;
		
	$elmt->mimetype = $mimetype;
	
	$elmt->name = utf8_encode($ligne);

	$elmt->date = filemtime($fic) * 1000;
	$elmt->size = filesize($fic);
	
	if ($is_dir) {
		$elmt->type = "directory";
		$dirs[] = $elmt;
	}
	else if ($is_file) {
		$elmt->type = "file";
		$files[] = $elmt;
	}
}

$finfo && finfo_close($finfo);

echo json_encode( array_merge($dirs,$files) );


?>