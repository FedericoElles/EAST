import urllib
import re
from jsmin import jsmin 

baseURL = 'http://shufflingsux.appspot.com/play/east/pages/'

pages = ["project_js","list_html","detail_html","tastekiddetail_html","tastekid_html","server"] #server must be last

pagesHTML = {}

def writeFile(name, content):
  fileObj = open(name,"w") # open for for write
  fileObj.write(content)
  fileObj.close()


def readURL(url):
  response = urllib.urlopen(url)
  html = response.read()
  return html

jquery_js  = readURL("https://ajax.googleapis.com/ajax/libs/jquery/1/jquery.min.js")
angular_js = readURL("https://ajax.googleapis.com/ajax/libs/angularjs/1.0.5/angular.min.js")
android_js = readURL("http://shufflingsux.appspot.com/play/fritzframework/pages/android_js")

writeFile ('angular.min.js', angular_js)
writeFile ('jquery.min.js', jquery_js)
writeFile ('android.js', android_js)
                    
#fetch css from webputty
webputty_css = readURL("http://fritzwebputty.commondatastorage.googleapis.com/agxzfmZyaXR6cHV0dHlyDAsSBFBhZ2UY6ekJDA.css")
writeFile ('style.css', webputty_css)


#1 for each page, fetch content in utf8
for page in pages:
  html = readURL(baseURL+page)
  html = html.replace('/play/east/pages/','')

  if page == 'project_js':
    html = html.replace('_html','.html')
    html = html.replace('east/pages/','')

  pagesHTML[page] = html

 

  if page == 'server':
    html = html.replace('https://ajax.googleapis.com/ajax/libs/jquery/1/jquery.min.js','jquery.min.js')
    html = html.replace('<script src="https://ajax.googleapis.com/ajax/libs/jquery/1/jquery.min.js"></script>','')
    html = html.replace('https://ajax.googleapis.com/ajax/libs/angularjs/1.0.5/angular.min.js','angular.min.js')
    html = html.replace('fritzframework/pages/android_js','android.js')    
    html = html.replace('//fritzwebputty.commondatastorage.googleapis.com/agxzfmZyaXR6cHV0dHlyDAsSBFBhZ2UY6ekJDA.css','style.css')
    html = html.replace('<script type="text/javascript">(function(w,d){if(w.location!=w.parent.location||w.location.search.indexOf(\'__preview_css__\')>-1){var t=d.createElement(\'script\');t.type=\'text/javascript\';t.async=true;t.src=\'http://fritzputty.appspot.com/js/agxzfmZyaXR6cHV0dHlyDAsSBFBhZ2UY6ekJDA\';(d.body||d.documentElement).appendChild(t);}})(window,document);</script>','')
    html = html.replace('<link href=\'http://fonts.googleapis.com/css?family=Roboto:700,500,400,300\' rel=\'stylesheet\' type=\'text/css\'>','')
    html = html.replace('/html/css/font-awesome.min.css','css/font-awesome.min.css')

    html = html.replace('http://commondatastorage.googleapis.com/akaparis/east/east.png','img/icons/east-96.png') #icon folder
    
    html = html.replace('<link rel="stylesheet" href="east/pages/css">','<link rel="stylesheet" href="style.css">')
                        
    html = html.replace('east/pages/project_js','project.js')
    
    writeFile ("index.html", html)
  else:
    writeFile (page.replace('_html','.html').replace('_js','.js'), html)
 
  print 'Processing: ' +page

print 'Done!'
