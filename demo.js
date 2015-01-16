require('./index.js').call({debug:true},
'el.dataset.prop = "val";\n'+
'var propvar = el.dataset.prop;\n'+
'document.querySelector("body").dataset.prop = "val";\n'+
'document.body["firstChild"].children[0].lastChild.dataset.prop ="n";\n'+
'elem.dataset["foo"];\n'+
'document.querySelector("body").dataset["foo"+8+"bar"] = "val";\n'+
'elem.dataset.prop = "complicated" + (function(){ return "function-call"})() + 3*(foo + 5)*bar;\n'
,true,'__DATASET_SHIM');
