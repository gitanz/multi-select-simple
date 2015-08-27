(function($){
    var $myEl;
    var self = {
        _initialize:function($selectEl){
            $selectEl.addClass(self.config.oldHideClassName);
            var valueArray = $selectEl.find('option').map(self._getValueFromOption);
            var $newSelect = self._buildUlLi(valueArray);
            var $parentDiv = $("<div/>").addClass(self.config.parentDivClass);
            var $searchField = $("<input type='text' width='auto' class='search-text-field' data-action='showDropdown' style='width:10px'>");
            var $selectedItems = $("<ul class='"+self.config.selectedItemsClass+"'/>");
            var $searchDiv = $("<div class='"+self.config.searchDivClass+"' data-trigger='focusInput'/>").append($selectedItems, $searchField);
            var $utilButtonApply = $("<button data-action='applySelection'>Apply</button>");
            var $utilButtonCancel = $("<button data-action='cancelSelection'>Cancel</button>");
            var $utilDiv = $("<div class='utilDiv'/>").append($utilButtonApply, $utilButtonCancel);

            //var $button = $("<button data-action='toggleDropdown'>▼</button>");
            //$searchDiv.append($button);
            $parentDiv.append($searchDiv, $newSelect, $utilDiv);
            
            $selectEl.after($parentDiv);
            
            var $baseDiv = $(".multi-select-simple");
            
            self._bindTriggeredActions($baseDiv);

            self._registerAllTriggers($baseDiv);
            
            self._bindClickActions($baseDiv);

        },
        _registerAllTriggers:function($baseDiv){
            $("body").on("click", function(e){
                if($(e.target).closest(".multi-select-simple").length > 0)
                    return;
                self.methods.hideDropdown();    
            });
            $baseDiv.on("focusInput",self.triggerHandlers.focusInput);
            $(".search-text-field").on("keydown", self.triggerHandlers.handleKeydown)
            $(".search-text-field").on("keyup", self.triggerHandlers.handleKeyup)
        },
        _bindTriggeredActions:function($baseDiv){
            $baseDiv.on("click","[data-trigger]", function(e){
                var $target = $(e.target);
                if($target.data().hasOwnProperty("trigger")){
                   $(this).trigger($(this).data("trigger"));
                }
            });
            
        },
        _bindClickActions:function($baseDiv){
            $baseDiv.on("click","[data-action]", function(e){
                var $target = $(e.target);
                if($target.data().hasOwnProperty("action")){
                    if( typeof(self.methods[$target.data("action")]) != typeof (undefined)){
                        // console.log("finding method "+$target.data("action"));
                        self.methods[$target.data("action")]($target);
                    }
                    else{
                        throw("No such '"+$target.data("action")+"' method defined in self.method! Define one to have action");
                    }
                }else{
                    debugger;
                }
            });
        },
        _getValueFromOption:function(){
            $option = $(arguments[1]);
            var rObj = {};
            rObj[$option.val()] = $option.html();
            return rObj;
        },
        _buildUlLi:function(valueArray){
            $ul = $("<ul/>").addClass(self.config.selectableUlClass);
            for(i=0; i < valueArray.length; i++){
                $li = $("<li/>").addClass(self.config.selectableLiClass);
                $.each(valueArray[i],function(key,value){
                    $li.attr("data-value",key);
                    $li.attr("data-action","selectElement")
                    $li.append(value);
                });
                $ul.append($li);
            }
            return $ul;
        }
    };

    self.triggerHandlers = {
        focusInput:function(){
            self.methods.focusInput();
        },
        handleKeydown:function(e){
            // console.log(event.keyCode);
            
            setWidth = $("input.search-text-field").width();
            
            if (event.keyCode == 8){

                setWidth = $("input.search-text-field").width() - 7;    
                $("input.search-text-field").val().length < 1 && self.methods.editLastSelection() && event.preventDefault() ;
            }

            if($.inArray(event.keyCode, [32, 188]) != -1){
                event.preventDefault();
                self.methods.selectFirstFoundElement();
            }

            if (event.keyCode >= 48 && event.keyCode <= 57)
                setWidth = $("input.search-text-field").width()+7;    

            if (event.keyCode >= 65 && event.keyCode <= 90)
                setWidth = $("input.search-text-field").width()+7;    

            if(setWidth < 10)
                setWidth = 10;

            $("input.search-text-field").width(setWidth);

        },
        handleKeyup:function(e){
            self.methods.doSearch()
        }

    }

    self.methods = {
        editLastSelection:function(){
            $lastItem = $("ul.selected-items li.selection-tokens:last");
            if(!$lastItem.length)
                return; 
            $element = $(".multi-select-ul li[data-action='unselectElement'][data-value='"+$lastItem.data("value")+"']");
            self.methods.unselectElement($element);
            self.methods.putItemToInput($lastItem);
            self.methods.focusInput();
            self.methods.doSearch();
        },
        putItemToInput:function($item){
            console.log("html : === "+$item.find("span:last").html());
            text = $item.find("span:last").html()+" ";
            setWidth = 10 + text.length * 7;
            $("input.search-text-field").val(text).width(setWidth);

        },
        selectFirstFoundElement:function(){
            $firstElement = $(".multi-select-ul li[data-action='selectElement']:visible:first");
            self.methods.selectElement($firstElement);
        },
        doSearch:function(){
            var searchText = $("input.search-text-field").val().trim();
            self.methods.refreshList();
            if(searchText.length>0){
                $(".multi-select-ul li[data-action='unselectElement']").hide();
                $(".multi-select-ul li[data-action='selectElement']").not(":contains("+searchText+")").hide();
                $(".multi-select-ul li[data-action='selectElement']:contains("+searchText+")").show();
            }
            if($(".multi-select-ul li[data-action]:visible").length<1)
                self.methods.showNoRecordsFound();

        },
        showNoRecordsFound:function(){
            $(".multi-select-ul").append("<li class='norecords'> No records found </li>");
        },
        toggleDropdown:function(){
            if($(".multi-select-ul").is(":visible")){
              self.methods.hideDropdown();
              return;
            }
            self.methods.showDropdown();
        },
        showDropdown:function(){
            $(".multi-select-ul").show();
        },
        hideDropdown:function(){
            $(".multi-select-ul").hide();
        },
        focusInput:function(){
            $("input.search-text-field").width()<10 && $("input.search-text-field").width(10)
            $(".search-text-field").trigger("focus").trigger("click");

        },
        removeSelection:function($element){
            $element = $element.parent();
            $listElement = $(".multi-select-ul li[data-value='"+$element.data("value")+"']");
            self.methods.unselectElement($listElement);
            self.methods.removeFromSelectedItemsList($element.data("value"));
        },

        unselectElement:function($element){
            $element.attr("data-action","selectElement").removeClass("active").data("action","selectElement");
            self.methods.clearInput();
            self.methods.focusInput();
            self.methods.removeFromSelectedItemsList($element.data("value"), $element.html());
            $myEl.find("option[value='"+$element.data("value")+"']").prop("selected","");
        },

        selectElement:function($element){
            if($element.hasClass("active") && $(".selected-items li[data-value='"+$element.data("value")+"']").length>0){
                self.methods.unselectElement($element);
            }
            else{
                self.methods.clearInput();
                self.methods.focusInput();
                self.methods.refreshList();
                $element.attr("data-action","unselectElement").addClass("active").data("action","unselectElement");
                self.methods.showInSelectedItemsList($element.data("value"), $element.html());
                $myEl.find("option[value='"+$element.data("value")+"']").prop("selected","selected");
            }
        },
        refreshList:function(){
            $(".multi-select-ul li.norecords").remove();
            $(".multi-select-ul li[data-action]").show();
        },
        clearInput:function(){
            $("input.search-text-field").val("");
        },
        showInSelectedItemsList:function(value, text){
            $li = $("<li class='selection-tokens' data-value='"+value+"'><span class='remove-selection' data-action='removeSelection'>×</span><span data-action='showDropdown'> "+text+"</span></li>");
            $(".selected-items").append($li);
        },

        removeFromSelectedItemsList:function(value){
            $(".selected-items li[data-value='"+value+"']").remove();
        }

    };
    self.config = {
        oldHideClassName : "hide-this-element",
        parentDivClass:"multi-select-simple",
        selectedItemsClass:"selected-items",
        selectableUlClass:"multi-select-ul",
        selectableLiClass:"selectable-li",
        searchDivClass:"search-div",
        searchTextFieldClass:"search-text-field"
    };
    $.extend($.fn, {
        multiselect_simple : function(options){
            $myEl = $(this);
            var isMultipleSelectElement = $myEl.is("select[multiple]");
            if(!isMultipleSelectElement){
                throw("This plugin requires the target element to be multiple select");
                return;
            }
            self._initialize($myEl);
        }
    });
}(jQuery))