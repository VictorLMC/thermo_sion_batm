
var PageAdr;
var channel_widgets = {}, general_widgets = {};
/* fichier de conversion */
var cnvFile = "";
/* fichier de consignes auto */
var csgFile = "";
var ViewMode = 1;
var dtMax = 35;

var jsVersion = 20200219;

if (window.addEventListener)//firefox,....
	window.addEventListener("load", build_ui);
else if (window.attachEvent)//IE
	window.attachEvent("onload", build_ui);


/***************************************************************************************
	remplissage de la page : multiplication du squelette pour N voies
		ajoute 2 formulaires identiques à l'existant, qui n'est pas modifié
***************************************************************************************/

function build_ui()
{
	var form = document.getElementById("channel");
	var div = document.getElementById("channels");
	template = form.innerHTML;
	for (var i = 2; i < 4; i++)
		{		
		//copie la voie  1 en 2 et 3
      var text = template.replace(/([_])1/g,  "$1"+i);
	/*$1,$2,$3, etc: References the submatched substrings inside parenthesized expressions
		within the regular expression.
		With it you can capture the result of a match and use it within the replacement text.*/

		form = document.createElement("form");

		form.setAttribute("id", "channel");
		form.innerHTML = text;
		//document.body.appendChild(form);
		div.appendChild(form);
		}

	init_gen_widgets();
	init_chan_widgets();	
	init_dialogs();

	document.getElementById('js').innerHTML = "JS : "+jsVersion;
    
	GetVal(1);
}

/***************************************************************************************
		remplissage tableaux widgets, et lien entre widgets et fonction js
***************************************************************************************/
function init_dialogs()
{
	console.log(navigator.appName, navigator.appVersion, navigator.appCodeName);
	console.log(navigator.userAgent);
	if (navigator.userAgent.indexOf('Chrome')== -1){
		//a ne pas faire avec chrome qui supporte les <dialog>
		 document.getElementById('selectDlg').style.display = 'none' ;
		 document.getElementById('editDlg').style.display = 'none' ;
	}
}

function init_gen_widgets()
{
var names = ["HmLnk", "ExeV", "FpgaV", "RtosV", "BeckProd", "Temp", "ChgPeriod", "ChgDtadc", "ChgTime", "startStop",
                    "Reboot","ChgModName", "SaveCfg", "wDog",
                    "Cnv", "editCnv", "selCnv","reloadCnv","cnvFile",
                    "Csg","editCsg", "selCsg","reloadCsg", "csgFile", 
                    "ChgTest", "ChgMode", "Time", "Date"];
//console.log ( "init general w");
  //  general_widgets[] = {};
	    for (var j = 0; j < names.length; j++)
			{
	        var name = names[j];
	      	var widget = document.getElementById(name);
            if (widget !== null ){
            // lie les items menu ChgXXX avec input_param()
                if (( name.search(/Chg/)!== -1 ) || ( name.search(/Reboot/)!== -1 )){
                    widget.onclick = input_param.bind(widget, name);
                   //
                   }
                if ( name.search(/reload/)!== -1 ){
                    //reload Csg/Cnv
                    widget.onclick = send_CONV_param.bind(widget, name);
                    //console.log(" bind "+ name);
                    }
                if (( name==="selCnv" ) || ( name==="selCsg" )){
                    //select Csg/Cnv 
                    console.log("set bind "+widget +" "+ name);
                    widget.onclick = openSelect.bind(widget, name);              
                    }
                if (( name==="editCnv" ) || ( name==="editCsg" )){
                    //edit Csg/Cnv 
                    console.log("set bind "+widget +" "+ name);
                    widget.onclick = openEdit.bind(widget, name);              
                    }            
                    
                if ( name.search(/Cfg/)!== -1 ){
                    //save config
                    widget.onclick = send_CONV_param.bind(widget, name);
                    }
               // console.log("g "+ name);
                general_widgets[name] = widget;
              }//end if !=null
	}//end for

}

function init_chan_widgets()
{
var names = [ "Name", "LabelSet","Iset", "Reg", "Irng", "Avg", 
              "Ir", "P",  "R","AvgMin", "AvgMax",
					"Stat", "RngMod", "Uoff", "Urng", "Ur", "X"];

for (var i = 1; i < 4; i++)
	{
	//console.log ( "init channels" + i);	
	//channel_widgets[ de 0 à 2 ]]
    channel_widgets[i-1] = {};
    //les elements de _1 à _3
	    for (var j = 0; j < names.length; j++)
			{
	        var name = names[j];
	      	var widget = document.getElementById(name + "_" + i);
	     	if(widget===null)
                    console.log("widget null" + name + "_" + i);
            else{
                if (widget.type == "text")
                    widget.onchange = send_channel_param.bind(widget, i, name);
           /*     else if (widget.type == "radio")
                    widget.onclick = send_channel_param.bind(widget, i, name); */
                else if (widget.type == "button") /// boutons +- avg
                    widget.onclick = send_channel_param.bind(widget, i, name);
                else if (widget.type == "select-one")
                    widget.onchange = send_channel_param.bind(widget, i, name);
                channel_widgets[i-1][name] = widget;
	        }
		}//end for

    }

}

/***************************************************************************************
		fonction d'envoi des parametres en cas de changement vers le cgi
*****************************************************************************************/


//////////////////////////////////////////////////////////////////////////////////////////

function send_CONV_param( param, value)
    {

	 var xhr = new XMLHttpRequest(),
        query = param + "=" + this.value,
            type = "application/x-www-form-urlencoded";
     xhr.open("POST", "WebPost");
     xhr.setRequestHeader("Content-Type", type);
     xhr.send(query);
     if ( param.search(/Cfg/)!= -1 )
         alert("Actual Config saved to MMR3.ini!"); 
    }


//////////////////////////////////////////////////////////////////////////////////////////

function input_param( param, value)
    {
    var result=0, val, retVal ;
	console.log("input", param, this);
        //si on a appuyé sur ok
        if ( (param.search(/Period/)!= -1) || (param.search(/Dtadc/)!=-1) ){
		var text ="";
        // entrée d'une nouvelle valeur de parametre
		if ( param.search(/Dtadc/)!=-1)
			text = "change "+ param + " (min=0 Max=" + dtMax + " )";
		else 
			text= "change "+ param + " (default:80 ms, min:10, Max:1000)";
           result = prompt(text, this.innerHTML);
           if (result != null)
            //ne recupere que les chiffres dans le cas de Period ou dtadc
                 retVal = result.match(/\d+/g);
        }
        else if  (param.search(/ModName/)!= -1) {
        		result = prompt("change "+ param, this.innerHTML);
        		retVal = result;
        	}
        else if  (param.search(/Reboot/)!= -1) {
        		result = confirm("Do you really want to reboot this module ??");
        		retVal = result;
        	}
       else if (param.search(/ChgTime/)!=-1){//changement de date
       	    retVal = result = updateDate() ;
            }
        else if (param.search(/ChgMode/)!=-1){//changement de mode expert=1, user=0
            if (ViewMode ==0) {
                ViewMode=1; this.innerText = "Mode : Expert";
            } 
            else  { 
                ViewMode =0;this.innerText = "Mode : User"; 
            }
           console.log("viewMode:", ViewMode);
            retVal = 0;
        }    

          if (result)
            send_general_param(param, retVal);

    }

//////////////////////////////////////////////////////////////////////////////////////////

function send_channel_param(channel, param)
    {
        	// channel de 1 a 3 (page web))
    	// c de 1 à 3(commandes)
    	var c = channel ;
 //window.alert("send");
	 var xhr = new XMLHttpRequest(),
        query = param + "_" + c + "=" + this.value,
            type = "application/x-www-form-urlencoded";
	 if (param.search(/Avg/)!=-1){
			//diminue ou diminue Avg de value (+1 ou -1)
			query = "Avg_" + c + "=";
		//	var val = parseInt(channel_widgets[channel].Avg.value)  +	parseInt(this.value);
			query += this.value;//val;
				console.log(query);
		}
     xhr.open("POST", "WebPost");
     xhr.setRequestHeader("Content-Type", type);
     xhr.send(query);
    }

/**********************************************************************************/
/*		Fonction de récupération des données JSON à interval régulier               */
/************************************************************************************/
function GetVal(init)
{
	var i, disable=false;

	xhttp=new XMLHttpRequest();
	// methode, url (pagename),
//	if (init == 1)
		//xhttp.open("GET","WebGet?init=1",true);
	//else //0 or undefined
		xhttp.open("GET","WebGet",true);
	xhttp.onreadystatechange=function() {
///console.log("resp=",xhttp.responseText);
	  if (xhttp.readyState !== 4
	       || xhttp.status !== 200
	       || xhttp.responseText === null
	       || typeof xhttp.responseText === "undefined")
	       return;  // Nothing to do this time.

	var response;
	 try {
	     response = JSON.parse(xhttp.responseText);
	//	 console.log("success JSON pars");
	}
	catch (err) {
	     console.log("Failed to parse JSON:","(", xhttp.responseText.length, ")", err, ":", xhttp.responseText);
	     //console.log(" c= ", xhttp.responseText.charCodeAt(xhttp.responseText.length -1));
	     return;
	     }

	// general widgets
	var channel = general_widgets,  data = response[0];
	if ( data.HmLnk !== undefined)
                channel.HmLnk.innerHTML =  data.HmLnk;

   if ( data.Url !== undefined) {
		//module connect� on passe a une autre page
			if (window.location.pathname !== data.Url)	{
			//	console.log( window.location.href , ":", data.Url );

				window.location.assign(data.Url);
				}
    	}

	if ( data.ExeV !== undefined){
                channel.ExeV.innerHTML = "Exe :" + data.ExeV;
             //   console.log("ExeV : ", data.ExeV );
                }
 	if ( data.FpgaV !== undefined)
                channel.FpgaV.innerHTML = "Fpga :" + data.FpgaV;
 	if ( data.RtosV !== undefined)
                channel.RtosV.innerHTML = "RTOS :" + data.RtosV;
 	if ( data.BeckProd !== undefined)
                channel.BeckProd.innerHTML = "BeckProd :" + data.BeckProd;	
   if ( data.Temp !== undefined)
                channel.Temp.innerHTML = "T : " + (data.Temp ) + " C";
    if (data.Period !== undefined ){//&& selectedTextArea !== channel.Period)
	                channel.ChgPeriod .innerHTML   = "Period =" + data.Period*2 + " ms";
			dtMax = data.Period -5; // dtAdc Max = demiPeriode - 5
	}
    if (data.Dtadc !== undefined )//&& selectedTextArea !== channel.Dtadc)
	                channel.ChgDtadc .innerHTML    = "DtAdc =" + data.Dtadc + " ms";
	if ( data.Time !== undefined){
                var thedate = new Date(data.Time *1000).toISOString();
                //The standard is called ISO-8601 and the format is: YYYY-MM-DDTHH:mm:ss.sssZ
                var dateptr = thedate.search("T");
                //isole la date (jusqu'à T)
                channel.Date.innerHTML = thedate.slice(0, dateptr);
                //isole l'heure (sans les ms) de T à .
                 channel.Time.innerHTML = thedate.slice (dateptr+1, thedate.length -5);
                 console.log(thedate,channel.Date.innerHTML, channel.Time.innerHTML);
	}
	if ( data.ModName !== undefined) { // nom du module
        channel.ChgModName.innerHTML = data.ModName; 
        document.title =  data.ModName + " (MMR3 v3)" ; 
    }  

	if ( data.wDog !== undefined) { // watchDog
               if ( data.wDog === 0)   channel.wDog.innerHTML = "WatchDog Off"; 
               else  channel.wDog.innerHTML = "WatchDog ON";               
    }  

    if ( (data.CnvFile !== undefined) && (data.CnvFile!=="")){
            channel.Cnv.innerHTML = data.CnvFile;
	    channel.cnvFile.innerHTML = data.CnvFile;
		cnvFile = data.CnvFile;
	}
    else{
       channel.Cnv.innerHTML = "no CNV File"; 
       channel.cnvFile.innerHTML = "no Conversion";
	cnvFile ="";
    }

    if ( (data.CsgFile !== undefined) && (data.CsgFile!=="")){
            csgFile = data.CsgFile;
            channel.Csg.innerHTML = data.CsgFile; 
            channel.csgFile.innerHTML = data.CsgFile;
	}
    else{
       channel.Csg.innerHTML = "no CSG File"; 
       channel.csgFile.innerHTML = "";  
	csgFile ="";
    }

    if (response.length > 1)
	//channels widgets
	for (var i = 0; i < 3; i++)
                {
                 channel = channel_widgets[i];
                 data = response[i+1];
                     disable=false;
                if (data.Stat !== undefined){
                	var value = parseInt(data.Stat);
                	console.log(value, value.toString(16));
                   // valeurs par défaut : quand tout va bien
                    var color = "black", background = "#00FF00", text = "OK ", cursor = "default";
	                //changement de couleur du fond
                  if ((value & 0x400)==0x400){
                        //couleur marron = calibrage en cours
                        background = "#B03B3B"; color = "white";
                        text = " CAL ";
                        disable=true;
                        cursor = "wait";// "url('images/hg_red.png'), auto"; 
                        } 
                  else{
                    if ((value & 0x200)==0x200){
                        //couleur rouge vif = non equlilibré      
                    	background = "yellow";                   
                        text =" N EQU ";
                        disable=true;
                        cursor = "wait";//"url('images/hg_red.png'), auto"; 
                        }
                    else {
                          //retour au curseur normal
                        document.getElementsByTagName('body')[0].style.cursor = 'default' ; 
                        if ((value & 0x20)==0x20){
	                        //couleur brun = erreur de conversion
                    	 	color = "yellow";
	                        background = "brown";
	                        text = " CONV ERR ";
	                        }
			else if ((value & 2)==2){
                            //couleur rouge sombre= saturation
                            background = "#800000";
                            color = "white";
                            text= " OVF ";
                            }
                         else if ((value & 0x40)==0x40){
                            //couleur orange = too big
                            background = "orange";
                            text = " NOT OPTIMAL ";
                         }
                         else if ((value & 0x80)==0x80){
                            //couleur rouge = too small
                            background = "#FF0000"; color = "white";    
                            text = " BAD ";
                            }
	            
                    }
                    channel.Stat.style.color = color;
                    channel.Stat.style.backgroundColor = background;
                    channel.Stat.innerHTML   =     text ;
                    if (ViewMode==1) { //expert
                        channel.Stat.innerHTML   += "0x" + Math.abs(value).toString(16) ;
                        if ((data.Rpp !== undefined) && ((value & 0x200)!=0x200))
                            channel.Stat.innerHTML  += " Rpp:" + data.Rpp.toExponential(3);
                        if ((data.C2 !== undefined) && ((value & 0x200)!=0x200))
                            channel.Stat.innerHTML  += " C2:" + data.C2.toExponential(3);
                    }
                    else if ((value & 0x200) == 0x200){
                        channel.Stat.innerHTML   +=  " "+ Math.abs(value & 0xff).toString(10)+"/10";
                    }
                    document.getElementsByTagName('body')[0].style.cursor = cursor;
                      //  console.log("status:", "0x" + value.toString(16));//
//
                  }
	        }

                
                //textedit
	            if ((data.Iset !== undefined )&& (document.activeElement !== channel.Iset)){
	                channel.Iset.value     = Number(data.Iset).toExponential(3);
                        channel.Iset.disabled = disable;
	               //console.log("Iset : ", data.Iset , data.Iset.toExponential(3) );
                }
     	            if ((data.Avg !== undefined) && (document.activeElement !== channel.Avg)){
	                channel.Avg.value     = data.Avg;
                         channel.Avg.disabled = disable;
	               // console.log("Avg : ", data.Avg );
                } 
               if ((data.Name !== undefined)&& (document.activeElement !== channel.Name))
            	   // nom du canal
               	                channel.Name.value = data.Name ;
                  //select list
                  if (data.Reg !== undefined){
                  //fix range, fix current, fix voltage, priority current, priority voltage
                    channel.Reg.selectedIndex = data.Reg;
                   if (((data.Reg == 2) || (data.Reg == 4) )&& (disable ==false)) {//voltage
//                        channel.RngMod.disabled = false;
                        channel.LabelSet.innerHTML = "U set (V)";
                        }
                    else {// current
//                        channel.RngMod.disabled = true;
                        channel.LabelSet.innerHTML = "I set (A)";
                        }
                    }
                  if (data.RngMod !== undefined) {//fix ou auto
                       //channel.RngMod.disabled = disable;
                       channel.RngMod.selectedIndex = data.RngMod; 
                    	   channel.Urng.disabled = (data.RngMod & 2); //auto U
                    	   channel.Irng.disabled = (data.RngMod & 1) ; // auto I
                    	 //  console.log("RngMod =", data.RngMod);
                    }
                  if (data.Irng !== undefined){
                   //    channel.Irng.disabled = disable;
                    channel.Irng.selectedIndex = data.Irng;
                }
                  if (data.Urng !== undefined){
                    channel.Urng.selectedIndex = data.Urng;
                   // channel.Urng.disabled = disable;
                  }
	                //outputs
	            if (data.Ir !== undefined){
	                channel.Ir.innerHTML = data.Ir.toExponential(3)+ " A";
                    //console.log("orange if ", data.Iset *0.9," - ", data.Ir, " - ", data.Iset *1.1);
	                if (((data.Iset * 0.9)> data.Ir) || ((data.Iset * 1.1)< data.Ir) ){
 	                	// courant reel != courant demandé
                        channel.Iset.style.background = "orange";
                    }
	                else 
	                	channel.Iset.style.background = "white";
	            }
	            if (data.Ur !== undefined)
	                channel.Ur.innerHTML   = data.Ur.toExponential(3) + " V";            
	            if (data.Uoff !== undefined)
	                channel.Uoff.innerHTML = data.Uoff.toExponential(3) + " V";
	            if (data.R !== undefined)
	                channel.R.innerHTML   = data.R.toExponential(3);
                if (data.X !== undefined){
                    if ( isNaN(data.X))
                        channel.X.innerHTML   = data.X;
                    else   
                        channel.X.innerHTML   = data.X.toExponential(3);
                }
	            if (data.P !== undefined)
	                channel.P.innerHTML   = data.P.toExponential(3);

	        }
	}//xhttp.onreadystatechange=function()
	xhttp.send();
	
	setTimeout('GetVal()', 2300);
}

/****************************************************************************************/
