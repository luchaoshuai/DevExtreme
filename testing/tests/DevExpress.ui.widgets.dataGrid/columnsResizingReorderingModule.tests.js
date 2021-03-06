"use strict";

QUnit.testStart(function() {

    var markup =
'<style>\
    body {\
        padding: 0;\
        margin: 0;\
    }\
</style>\
<div style="padding: 0px 40px; margin: 0px 50px">\
    <div id="testContainer"></div>\
</div>\
<div id="root">\
    <div id="container" class="dx-datagrid"></div>\
    <div id="container2" class="dx-datagrid"></div>\
</div>\
<div id="itemsContainer" style="font-size: 0"><div style="width:125px; display: inline-block;"></div><div style="width:125px; display: inline-block;"></div></div>\
<div id="itemsContainerVertical"><div style="width:125px; height: 50px;" ></div><div style="width:125px; height: 50px;" ></div></div>';

    $("#qunit-fixture").html(markup);
});

require("common.css!");

require("ui/data_grid/ui.data_grid");

var $ = require("jquery"),
    noop = require("core/utils/common").noop,
    dataGridMocks = require("../../helpers/dataGridMocks.js"),
    MockTablePositionViewController = dataGridMocks.MockTablePositionViewController,
    MockTrackerView = dataGridMocks.MockTrackerView,
    MockColumnsSeparatorView = dataGridMocks.MockColumnsSeparatorView,
    MockDraggingPanel = dataGridMocks.MockDraggingPanel,
    TestDraggingHeader = dataGridMocks.TestDraggingHeader,
    setupDataGridModules = dataGridMocks.setupDataGridModules,
    MockDataController = dataGridMocks.MockDataController,
    MockColumnsController = dataGridMocks.MockColumnsController,
    MockEditingController = dataGridMocks.MockEditingController;


var gridCore = require("ui/data_grid/ui.data_grid.core"),
    dragEvents = require("events/drag"),
    columnResizingReordering = require("ui/data_grid/ui.data_grid.columns_resizing_reordering"),
    ColumnChooserView = require("ui/data_grid/ui.data_grid.column_chooser").ColumnChooserView,
    ColumnHeadersView = require("ui/data_grid/ui.data_grid.column_headers").ColumnHeadersView,
    RowsView = require("ui/data_grid/ui.data_grid.rows").RowsView,
    GroupingHeaderPanelExtender = require("ui/data_grid/ui.data_grid.grouping").GroupingHeaderPanelExtender,
    HeaderPanel = require("ui/data_grid/ui.data_grid.header_panel").HeaderPanel,
    domUtils = require("core/utils/dom"),
    Action = require("core/action"),
    devices = require("core/devices"),
    publicComponentUtils = require("core/utils/public_component");

var TestDraggingHeader2 = columnResizingReordering.DraggingHeaderView.inherit({
    callDragCounter: 0,

    callMoveCounter: 0,

    callDropCounter: 0,

    dragHeader: function(args) {
        this.callDragCounter++;
    },

    moveHeader: function(args) {
        args.jQueryEvent.data.that.callMoveCounter++;
    },

    dropHeader: function(args) {
        args.jQueryEvent.data.that.callDropCounter++;
    }
});

///ColumnsSeparator module///
(function() {
    QUnit.module('ColumnsSeparator');

    function createColumnsSeparator2(userOptions, columnsCommonSettings) {
        return new columnResizingReordering.ColumnsSeparatorView({
            option: function(name) {
                return userOptions[name];
            },
            _controllers: {
                columns: {
                    getCommonSettings: function() {
                        return columnsCommonSettings;
                    },
                    isColumnOptionUsed: function(optionName) {
                        return columnsCommonSettings[optionName];
                    }
                },
                tablePosition: {
                    positionChanged: $.Callbacks()
                }
            },

            NAME: "dxDataGrid"
        });
    }

    function createColumnsSeparator(isResizable, container) {
        var separator = new columnResizingReordering.ColumnsSeparatorView({
            option: function(name) {
                switch(name) {
                    case "allowColumnReordering":
                        return true;
                    case "allowColumnResizing":
                        return isResizable;
                    default :
                        return true;
                }
            },
            _controllers: {
                columns: {
                    getCommonSettings: function() {
                        return {
                            allowReordering: true,
                            allowResizing: isResizable
                        };
                    },

                    isColumnOptionUsed: function(optionName) {
                        if(optionName === "allowReordering") {
                            return true;
                        }

                        if(optionName === "allowResizing") {
                            return isResizable;
                        }
                    }
                },
                tablePosition: {
                    positionChanged: $.Callbacks()
                }
            },

            NAME: "dxDataGrid"
        });

        separator.init();
        separator.render(container ? container : $('#container'));

        return separator;
    }

    QUnit.test("Initialize by default", function(assert) {
        //arrange, act
        var columnsSeparator = createColumnsSeparator();

        //assert
        assert.ok(!columnsSeparator._isTransparent, 'transparent mode');
        assert.ok(columnsSeparator.element(), 'element is initialized');
        assert.ok(!columnsSeparator._isShown, 'is not shown');
        assert.equal(columnsSeparator.element().css('display'), 'none', 'element is hidden');
    });

    QUnit.test("second render", function(assert) {
        //arrange
        var columnsSeparator = createColumnsSeparator();

        //act
        columnsSeparator.render();

        //assert
        assert.ok(!columnsSeparator._isTransparent, 'transparent mode');
        assert.ok(columnsSeparator.element(), 'element is initialized');
        assert.ok(!columnsSeparator._isShown, 'is not shown');
        assert.equal(columnsSeparator.element().css('display'), 'none', 'element is hidden');
    });

    QUnit.test("Show", function(assert) {
        //arrange
        var columnsSeparator = createColumnsSeparator();

        //act
        columnsSeparator.show();

        //assert
        assert.ok(columnsSeparator.element().css('display'), 'element is shown');
        assert.ok(columnsSeparator.element().hasClass("dx-datagrid-columns-separator"), 'element is shown');
    });

    QUnit.test("Show is called only one", function(assert) {
        //arrange
        var showCalledCounter = 0,
            columnsSeparator = createColumnsSeparator();

        //act
        columnsSeparator.element().show = function() {
            showCalledCounter++;
        };

        columnsSeparator.show();
        columnsSeparator.show();
        columnsSeparator.show();
        columnsSeparator.show();
        columnsSeparator.show();

        //assert
        assert.ok(columnsSeparator._isShown, 'is shown');
        assert.equal(showCalledCounter, 1, 'show method is called');
    });

    QUnit.test("Show is called only one when transparent mode", function(assert) {
        //arrange
        var showCalledCounter = 0,
            columnsSeparator = createColumnsSeparator(true);

        //act
        columnsSeparator.element().removeClass = function() {
            showCalledCounter++;
        };

        columnsSeparator.show();
        columnsSeparator.show();
        columnsSeparator.show();
        columnsSeparator.show();
        columnsSeparator.show();

        //assert
        assert.ok(columnsSeparator._isShown, 'is shown');
        assert.equal(showCalledCounter, 1, 'show method is called');
    });

    QUnit.test("Hide is called only one", function(assert) {
        //arrange
        var hideCalledCounter = 0,
            columnsSeparator = createColumnsSeparator();

        //act
        columnsSeparator.element().hide = function() {
            hideCalledCounter++;
        };

        columnsSeparator.show();
        columnsSeparator.hide();
        columnsSeparator.hide();
        columnsSeparator.hide();
        columnsSeparator.hide();
        columnsSeparator.hide();

        //assert
        assert.ok(!columnsSeparator._isShown, 'is shown');
        assert.equal(hideCalledCounter, 1, 'hide method is called');
    });

    QUnit.test("hide is called only one when transparent mode", function(assert) {
        //arrange
        var hideCalledCounter = 0,
            columnsSeparator = createColumnsSeparator(true);

        //act
        columnsSeparator.element().addClass = function() {
            hideCalledCounter++;
        };

        columnsSeparator.show();
        columnsSeparator.hide();
        columnsSeparator.hide();
        columnsSeparator.hide();
        columnsSeparator.hide();
        columnsSeparator.hide();

        //assert
        assert.ok(!columnsSeparator._isShown, 'is shown');
        assert.equal(hideCalledCounter, 1, 'hide method is called');
    });

    QUnit.test("Initialize with transparent", function(assert) {
        //arrange, act
        var columnsSeparator = createColumnsSeparator(true);

        //assert
        assert.ok(columnsSeparator._isTransparent, 'transparent mode');
        assert.ok(columnsSeparator.element(), 'element is initialized');
        assert.ok(columnsSeparator.element().hasClass("dx-datagrid-columns-separator-transparent"), 'element is transparent');
    });

    QUnit.test("Show with transparent", function(assert) {
        //arrange
        var columnsSeparator = createColumnsSeparator();

        //act
        columnsSeparator.show();

        //assert
        assert.ok(!columnsSeparator.element().hasClass("dx-datagrid-columns-separator-transparent"), 'element is not transparent');
        assert.ok(columnsSeparator.element().hasClass("dx-datagrid-columns-separator"), 'element is shown');
    });

    QUnit.test("SetHeight", function(assert) {
        //arrange
        var columnsSeparator = createColumnsSeparator();

        //act
        columnsSeparator.height(73);

        //assert
        assert.equal(columnsSeparator.element().height(), 73, 'element height');
    });

    QUnit.test("Get/set width", function(assert) {
        //arrange
        var columnsSeparator = createColumnsSeparator();

        //act
        columnsSeparator.width(23);

        //assert
        assert.equal(columnsSeparator.width(), 23, 'custom width');
    });

    QUnit.test("moveByX", function(assert) {
        //arrange
        var columnsSeparator = createColumnsSeparator(false, $('#testContainer'));

        //act
        columnsSeparator.moveByX(117);
        columnsSeparator.show();

        //assert
        assert.equal(columnsSeparator.element().css('left'), '10027px', 'element position by x');
    });

    QUnit.test("changeCursor", function(assert) {
        //arrange
        var columnsSeparator = createColumnsSeparator();

        //act
        columnsSeparator.changeCursor('col-resize');

        //assert
        assert.equal(columnsSeparator.element().css('cursor'), 'col-resize', 'cursor');
    });

    QUnit.test("Subscribe to position changed event when showColumnHeaders is false", function(assert) {
        //arrange
        var columnsSeparator = createColumnsSeparator2({ showColumnHeaders: false }, { allowReordering: true, allowResizing: true }),
            isSubscribeToEventCalled;

        columnsSeparator._subscribeToEvent = function() {
            isSubscribeToEventCalled = true;
        };

        //act
        columnsSeparator.init();

        assert.ok(!isSubscribeToEventCalled, "not subscribed to event");
    });

    QUnit.test("Subscribe to position changed event when showColumnHeaders is true", function(assert) {
        //arrange
        var columnsSeparator = createColumnsSeparator2({ showColumnHeaders: true }, { allowReordering: true, allowResizing: true }),
            isSubscribeToCallbackCalled;

        columnsSeparator._subscribeToCallback = function() {
            isSubscribeToCallbackCalled = true;
        };

        //act
        columnsSeparator.init();

        assert.ok(isSubscribeToCallbackCalled, "subscribed to event");
    });

    QUnit.test("Subscribe to position changed event when columns are not allowReordering", function(assert) {
        //arrange
        var columnsSeparator = createColumnsSeparator2({ showColumnHeaders: true }, { allowReordering: false }),
            isSubscribeToEventCalled;

        columnsSeparator._subscribeToEvent = function() {
            isSubscribeToEventCalled = true;
        };

        //act
        columnsSeparator.init();

        assert.ok(!isSubscribeToEventCalled, "not subscribed to event");
    });

    QUnit.test("Subscribe to position changed event when columns are allowReordering", function(assert) {
        //arrange
        var columnsSeparator = createColumnsSeparator2({ showColumnHeaders: true }, { allowReordering: true }),
            isSubscribeToCallbackCalled;

        columnsSeparator._subscribeToCallback = function() {
            isSubscribeToCallbackCalled = true;
        };

        //act
        columnsSeparator.init();

        assert.ok(isSubscribeToCallbackCalled, "subscribed to event");
    });

    QUnit.test("Subscribe to position changed event when columns are not allowResizing", function(assert) {
        //arrange
        var columnsSeparator = createColumnsSeparator2({ showColumnHeaders: true }, { allowResizing: false }),
            isSubscribeToEventCalled;

        columnsSeparator._subscribeToEvent = function() {
            isSubscribeToEventCalled = true;
        };

        //act
        columnsSeparator.init();

        assert.ok(!isSubscribeToEventCalled, "not subscribed to event");
    });

    QUnit.test("Subscribe to position changed event when columns are allowResizing", function(assert) {
        //arrange
        var columnsSeparator = createColumnsSeparator2({ showColumnHeaders: true }, { allowResizing: true }),
            isSubscribeToCallbackCalled;

        columnsSeparator._subscribeToCallback = function() {
            isSubscribeToCallbackCalled = true;
        };

        //act
        columnsSeparator.init();

        assert.ok(isSubscribeToCallbackCalled, "subscribed to event");
    });

    QUnit.test("Subscribe to position changed event when columns are not allowResizing and allowReordering", function(assert) {
        //arrange
        var columnsSeparator = createColumnsSeparator2({ showColumnHeaders: true }, { allowResizing: false, allowReordering: false }),
            isSubscribeToEventCalled;

        columnsSeparator._subscribeToEvent = function() {
            isSubscribeToEventCalled = true;
        };

        //act
        columnsSeparator.init();

        assert.ok(!isSubscribeToEventCalled, "not subscribed to event");
    });

    QUnit.test("Update height and top position", function(assert) {
        //arrange
        var component = {
                option: function() {
                    return true;
                },
                _controllers: {
                    columns: {
                        getCommonSettings: function() {
                            return {
                                allowReordering: true,
                                allowResizing: true
                            };
                        },
                        isColumnOptionUsed: function(optionName) {
                            return true;
                        }
                    }
                },
                _views: {
                    columnHeadersView: {
                        element: function() {
                            return $(".dx-datagrid-headers");
                        },
                        getHeight: function() {
                            return 45;
                        },
                        getHeadersRowHeight: function() {
                            return 20;
                        }
                    },
                    rowsView: {
                        height: function() {
                            return 100;
                        },
                        resizeCompleted: $.Callbacks(),
                        getScrollbarWidth: function() {
                            return 0;
                        }
                    }
                },
                NAME: "dxDataGrid"
            },
            tablePosition,
            $separator,
            $container = $("#container"),
            separator;

        //act
        $("<div/>")
            .height(100)
            .appendTo($container);

        $("<div/>")
            .addClass("dx-datagrid-headers")
            .appendTo($container);

        tablePosition = new columnResizingReordering.TablePositionViewController(component);
        component._controllers.tablePosition = tablePosition;
        tablePosition.init();

        separator = new columnResizingReordering.ColumnsSeparatorView(component);
        separator.init();
        separator.render($container);

        tablePosition.update();

        //arrange
        $separator = separator.element();
        assert.equal($separator.height(), 145, "height of columns separator");
        assert.equal($separator.css("top"), "100px", "height of columns separator");
    });

    QUnit.test("Update height when horizontal scrollbar is shown", function(assert) {
        //arrange
        var columnHeadersViewHeight = 45,
            rowsViewHeight = 100,
            scrollBarWidth = 16,
            component = {
                option: function() {
                    return true;
                },
                _controllers: {
                    columns: {
                        getCommonSettings: function() {
                            return {
                                allowReordering: true,
                                allowResizing: true
                            };
                        },
                        isColumnOptionUsed: function(optionName) {
                            return true;
                        }
                    }
                },
                _views: {
                    columnHeadersView: {
                        element: function() {
                            return $(".dx-datagrid-headers");
                        },
                        getHeight: function() {
                            return columnHeadersViewHeight;
                        },
                        getHeadersRowHeight: function() {
                            return 20;
                        }
                    },
                    rowsView: {
                        height: function() {
                            return rowsViewHeight;
                        },
                        resizeCompleted: $.Callbacks(),
                        getScrollbarWidth: function(isHorizontal) {
                            return isHorizontal ? scrollBarWidth : 0;
                        }
                    },
                    _pagerView: {
                        getHeight: function() {
                            return 10;
                        }
                    }
                },
                NAME: "dxDataGrid"
            },
            tablePosition,
            $container = $("#container"),
            separator;

        //act
        $("<div/>")
            .addClass("dx-datagrid-headers")
            .appendTo($container);

        tablePosition = new columnResizingReordering.TablePositionViewController(component);
        component._controllers.tablePosition = tablePosition;
        tablePosition.init();

        separator = new columnResizingReordering.ColumnsSeparatorView(component);
        separator.init();
        separator.render($container);

        tablePosition.update();

        //arrange
        assert.equal(separator.element().height(), columnHeadersViewHeight + rowsViewHeight - scrollBarWidth, "height of columns separator");
    });

    QUnit.test("IsVisible when columns options is empty", function(assert) {
        //arrange
        var getComponent = function(isResizing, isReordering) {
                return {
                    option: function(optionName) {
                        switch(optionName) {
                            case "allowColumnResizing":
                                return isResizing;
                            case "allowColumnReordering":
                                return isReordering;
                            default:
                                return true;
                        }
                    },
                    _controllers: {
                        columns: {
                            getCommonSettings: function() {
                                return { };
                            },
                            isColumnOptionUsed: function(optionName) {}
                        }
                    }
                };
            },
            separator = new columnResizingReordering.ColumnsSeparatorView(getComponent(true));

        //assert
        assert.ok(separator.isVisible(), "AllowColumnResizing");

        //act
        separator = new columnResizingReordering.ColumnsSeparatorView(getComponent(false, true));

        //assert
        assert.ok(separator.isVisible(), "AllowColumnReordering");
    });

    QUnit.test("Initialize separator view when the allowColumnResizing is changed", function(assert) {
        //arrange
        var userOptions = {
                showColumnHeaders: true,
                allowColumnResizing: false
            },
            columnsSeparator = createColumnsSeparator2(userOptions, { });

        columnsSeparator.init();
        columnsSeparator.render($("#container"));
        sinon.spy(columnsSeparator, "_invalidate");

        //act
        userOptions.allowColumnResizing = true;
        columnsSeparator.optionChanged({
            name: "allowColumnResizing",
            value: true
        });
        var tablePositionController = columnsSeparator.getController("tablePosition");

        //assert
        assert.ok(columnsSeparator._isTransparent, "is transparent");
        assert.ok(columnsSeparator._invalidate.called, "_invalidate is called");
        assert.deepEqual(columnsSeparator._invalidate.args[0], [], "_invalidate args");
        assert.ok(tablePositionController.positionChanged.has(columnsSeparator._positionChanged), "subscribe to positionChanged");

        //act
        userOptions.allowColumnResizing = false;
        columnsSeparator.optionChanged({
            name: "allowColumnResizing",
            value: false
        });

        //assert
        assert.ok(!columnsSeparator._isTransparent, "is transparent");
        assert.ok(!tablePositionController.positionChanged.has(columnsSeparator._positionChanged), "unsubscribe to positionChanged");
        assert.ok(!columnsSeparator.element().hasClass("dx-datagrid-columns-separator-transparent"), "remove transparent css class");
        assert.equal(columnsSeparator.element().css("display"), "none", "element is hidden");
    });

    QUnit.test("Show element and add transparent css class when separator is hidden", function(assert) {
        var userOptions = {
                showColumnHeaders: true,
                allowColumnResizing: true
            },
            columnsSeparator = createColumnsSeparator2(userOptions, { });

        columnsSeparator.init();
        columnsSeparator.render($("#container"));

        //act
        userOptions.allowColumnResizing = false;
        columnsSeparator.optionChanged({
            name: "allowColumnResizing",
            value: false
        });

        userOptions.allowColumnResizing = true;
        columnsSeparator.optionChanged({
            name: "allowColumnResizing",
            value: false
        });
        columnsSeparator.render($("#container"));

        //assert
        assert.notEqual(columnsSeparator.element().css("display"), "none", "element is shown");
    });
}());

function getJQueryEvent(options) {
    return {
        jQueryEvent: $.extend({}, {
            preventDefault: noop,
            stopPropagation: noop
        }, options)
    };
}

///Columns resizing///
(function() {
    QUnit.module('Columns resizing', {
        beforeEach: function() {
            var that = this;

            that.commonColumnSettings = { allowResizing: true };

            that.options = {
                columns: [
                        { caption: 'Column 1', visible: true, width: 150, index: 0 },
                        { caption: 'Column 2', visible: true, width: 150, index: 1 }
                ],
                showColumnHeaders: true,
                pager: {
                    visible: true
                },
                commonColumnSettings: that.commonColumnSettings
            };

            that.component = {
                on: noop,

                off: noop,

                NAME: "dxDataGrid",

                _suppressDeprecatedWarnings: noop,

                _resumeDeprecatedWarnings: noop,

                updateDimensions: noop,

                setAria: function(name, value, $target) {
                    var setAttribute = function(option) {
                        var attrName = ($.inArray(option.name, ["role", "id"]) + 1) ? option.name : "aria-" + option.name,
                            attrValue = option.value;

                        if(attrValue === null || attrValue === undefined) {
                            attrValue = undefined;
                        } else {
                            attrValue = attrValue.toString();
                        }

                        domUtils.toggleAttr(option.target, attrName, attrValue);
                    };

                    if(!$.isPlainObject(arguments[0])) {
                        setAttribute({
                            name: arguments[0],
                            value: arguments[1],
                            target: arguments[2] || this._getAriaTarget()
                        });
                    } else {
                        $target = arguments[1] || this._getAriaTarget();

                        $.each(arguments[0], function(key, value) {
                            setAttribute({
                                name: key,
                                value: value,
                                target: $target
                            });
                        });
                    }
                },

                option: function(name) {
                    return that.options[name];
                },

                _createAction: function(actionSource, config) {
                    var action = new Action(actionSource, config);
                    return function(e) {
                        return action.execute.call(action, $.extend(e, {
                            component: that,
                            element: that.component.element()
                        }));
                    };
                },

                element: function() {
                    return $("#container");
                },

                _fireContentReadyAction: function() {

                },

                _controllers: {
                    tablePosition: new MockTablePositionViewController(),
                    columns: new MockColumnsController(that.options.columns, that.commonColumnSettings),
                    data: new MockDataController({
                        pageCount: 1,
                        pageIndex: 0,
                        items: [
                            { values: [1] },
                            { values: [2] }
                        ]
                    })
                },

                _createComponent: function(element, name, config) {
                    name = typeof name === "string" ? name : publicComponentUtils.name(name);
                    var $element = $(element)[name](config || {});
                    return $element[name]("instance");
                },

                _createActionByOption: function() {
                    return function() { };
                }
            };

            that.component._views = {
                columnsSeparatorView: new columnResizingReordering.ColumnsSeparatorView(this.component),
                trackerView: new MockTrackerView(),
                columnHeadersView: new ColumnHeadersView(this.component),
                rowsView: new RowsView(this.component),
                pagerView: {
                    init: noop,
                    isVisible: noop,
                    render: noop,
                    getHeight: function() {
                        return 0;
                    }
                }
            };

            that.initViews = function() {
                $.each(that.component._views, function(key, value) {
                    value.init();
                });
            };

            that.renderViews = function($container) {
                $.each(that.component._views, function(key, view) {
                    view.render($container);
                });
            };

            that.createColumnsResizerViewController = function(columns) {
                if(columns) {
                    that.component._controllers.columns = new MockColumnsController(columns, that.commonColumnSettings);
                }

                that.component._controllers.editing = new MockEditingController();

                var controller = new columnResizingReordering.ColumnsResizerViewController(that.component);

                controller.init();

                that.initViews();

                return controller;
            };

            $('#container').css({ width: '300px' });
        }
    });

    QUnit.test('Get points by columns', function(assert) {
        //arrange
        var resizeController = this.createColumnsResizerViewController([
                    { caption: 'Column 1', width: '125px' },
                    { caption: 'Column 2', width: '125px' },
                    { caption: 'Column 3', width: '125px' },
                    { caption: 'Column 4', width: '125px' }
            ]),
            $container = $("#container");

        //act
        $container.css({ width: '500px', height: '500px' });
        resizeController._columnHeadersView.render($container);
        resizeController._columnsSeparatorView.render($container);
        resizeController._$parentContainer = $container;
        resizeController._moveSeparator({
            jQueryEvent: {
                data: resizeController,
                pageY: -9995
            }
        });

        //assert
        assert.deepEqual(resizeController._pointsByColumns, [
            { x: -9875, y: -10000, columnIndex: 0, index: 1 },
            { x: -9750, y: -10000, columnIndex: 1, index: 2 },
            { x: -9625, y: -10000, columnIndex: 2, index: 3 }
        ], 'column index 0');
    });

    QUnit.test('Get points by columns if columnResizingMode is widget', function(assert) {
        //arrange
        this.options.columnResizingMode = "widget";
        var resizeController = this.createColumnsResizerViewController([
                    { caption: 'Column 1', width: '125px' },
                    { caption: 'Column 2', width: '125px' },
                    { caption: 'Column 3', width: '125px' },
                    { caption: 'Column 4', width: '125px' }
            ]),
            $container = $("#container");

        //act
        $container.css({ width: '500px', height: '500px' });
        resizeController._columnHeadersView.render($container);
        resizeController._columnsSeparatorView.render($container);

        //assert
        assert.deepEqual(resizeController.pointsByColumns(), [
            { x: -9875, y: -10000, columnIndex: 0, index: 1 },
            { x: -9750, y: -10000, columnIndex: 1, index: 2 },
            { x: -9625, y: -10000, columnIndex: 2, index: 3 },
            { x: -9500, y: -10000, columnIndex: 3, index: 4 }
        ], 'points by columns');
    });

    QUnit.test('Get points by columns if columnResizingMode is widget and RTL', function(assert) {
        //arrange
        this.options.columnResizingMode = "widget";
        this.options.rtlEnabled = true;
        $("#container").css('direction', 'rtl');
        var resizeController = this.createColumnsResizerViewController([
                    { caption: 'Column 1', width: '125px' },
                    { caption: 'Column 2', width: '125px' },
                    { caption: 'Column 3', width: '125px' },
                    { caption: 'Column 4', width: '125px' }
            ]),
            $container = $("#container");

        //act
        $container.css({ width: '500px', height: '500px' });
        resizeController._columnHeadersView.render($container);
        resizeController._columnsSeparatorView.render($container);

        //assert
        assert.deepEqual(resizeController.pointsByColumns(), [
            { x: -9500, y: -10000, columnIndex: 0, index: 0 },
            { x: -9625, y: -10000, columnIndex: 1, index: 1 },
            { x: -9750, y: -10000, columnIndex: 2, index: 2 },
            { x: -9875, y: -10000, columnIndex: 3, index: 3 }
        ], 'points by columns');
    });

    QUnit.test('Get points by band columns', function(assert) {
        //arrange
        var resizeController = this.createColumnsResizerViewController([
            [
                        { caption: 'Column 1', width: '125px', rowspan: 2, index: 0, allowResizing: true },
                        { caption: "Band Column 1", isBand: true, colspan: 2, index: 1, allowResizing: true },
                        { caption: 'Column 4', width: '125px', rowspan: 2, index: 4, allowResizing: true }
            ],
            [
                        { caption: 'Column 2', width: '125px', ownerBand: "Band Column 1", index: 2, allowResizing: true },
                        { caption: 'Column 3', width: '125px', ownerBand: "Band Column 1", index: 3, allowResizing: true }
            ],
            [
                        { caption: 'Column 1', width: '125px', rowspan: 2, rowIndex: 0, index: 0, allowResizing: true },
                        { caption: 'Column 2', width: '125px', ownerBand: "Band Column 1", rowIndex: 1, index: 2, allowResizing: true },
                        { caption: 'Column 3', width: '125px', ownerBand: "Band Column 1", rowIndex: 1, index: 3, allowResizing: true },
                        { caption: 'Column 4', width: '125px', rowspan: 2, rowIndex: 0, index: 4, allowResizing: true }
            ]
            ]),
            $container = $("#container");

        $container.css({ width: '500px', height: '500px' });
        resizeController._columnHeadersView.render($container);
        resizeController._columnsSeparatorView.render($container);
        resizeController._$parentContainer = $container;

        //act
        resizeController._moveSeparator({
            jQueryEvent: {
                data: resizeController,
                pageY: -9995
            }
        });

        //assert
        assert.equal(resizeController._pointsByColumns.length, 3, "count point");
        assert.deepEqual(resizeController._pointsByColumns[0], { x: -9875, y: -10000, columnIndex: 0, index: 1 });
        assert.equal(resizeController._pointsByColumns[1].x, -9750, "x-coordinate of the second point");
        assert.ok(resizeController._pointsByColumns[1].y > -9970 && resizeController._pointsByColumns[1].y < -9960, "y-coordinate of the second point");
        assert.equal(resizeController._pointsByColumns[1].columnIndex, 1, "columnIndex of the second point");
        assert.equal(resizeController._pointsByColumns[1].index, 2, "index of the second point");
        assert.deepEqual(resizeController._pointsByColumns[2], { x: -9625, y: -10000, columnIndex: 2, index: 3 });
    });

    QUnit.test('Get points by columns when column contains column is not allowResizing', function(assert) {
        //arrange
        var testColumns = [
                    { caption: 'Column 1', width: '125px' },
                    { caption: 'Column 2', width: '125px', allowResizing: false },
                    { caption: 'Column 3', width: '125px' },
                    { caption: 'Column 4', width: '125px' }
            ],
            resizeController = this.createColumnsResizerViewController(testColumns),
            $container = $("#container");

        //act
        $container.css({ width: '500px', height: '500px' });
        resizeController._columnHeadersView.render($container);
        resizeController._columnsSeparatorView.render($container);
        resizeController._$parentContainer = $container;
        resizeController._moveSeparator({
            jQueryEvent: {
                data: resizeController,
                pageY: -9995
            }
        });

        //assert
        assert.deepEqual(resizeController._pointsByColumns, [
            { "columnIndex": 2, "index": 3, "x": -9625, y: -10000 }
        ], 'column index 0');
    });

    QUnit.test('Initialize resizeController', function(assert) {
        //arrange
        var resizeController = this.createColumnsResizerViewController(),
            $container = $("#container");

        //act
        resizeController._columnHeadersView.render($container);
        resizeController._columnsSeparatorView.render($container);
        resizeController._$parentContainer = $container;
        resizeController._moveSeparator({
            jQueryEvent: {
                data: resizeController,
                pageY: -9995
            }
        });

        //assert
        assert.deepEqual(resizeController._pointsByColumns, [{
            columnIndex: 0,
            index: 1,
            x: -9850,
            y: -10000
        }], 'options.pointsByColumns of resizeController');
    });

    QUnit.test('Unsubscribe from events when columns separator is rendered', function(assert) {
        //arrange
        var resizeController = this.createColumnsResizerViewController(),
            isUnsubscribeFromEventsCalled = false;

        //act
        resizeController._unsubscribeFromEvents = function() {
            isUnsubscribeFromEventsCalled = true;
        };
        resizeController._columnHeadersView.render($("#container"));
        resizeController._columnsSeparatorView.render($("#container"));

        //assert
        assert.ok(isUnsubscribeFromEventsCalled, 'columnsResizer.dispose is called');
    });

    QUnit.test('Unsubscribe and subscribe to dxpointermove_T136595', function(assert) {
        //arrange
        var resizeController1 = this.createColumnsResizerViewController(),
            resizeController2 = this.createColumnsResizerViewController(),
            isMoveSeparatorCalled,
            $container1 = $("#container"),
            $container2 = $("#container2");

        //act
        resizeController1._moveSeparator = function() {
            isMoveSeparatorCalled = true;
        };
        resizeController1._columnHeadersView.render($container1);
        resizeController1._columnsSeparatorView.render($container1);
        resizeController2._columnsSeparatorView.render($container2);

        resizeController1._$parentContainer.trigger("dxpointermove");

        //assert
        assert.ok(isMoveSeparatorCalled);
    });

    QUnit.test('Unsubscribe and subscribe to dxpointerdown_T136595', function(assert) {
        //arrange
        var resizeController1 = this.createColumnsResizerViewController(),
            resizeController2 = this.createColumnsResizerViewController(),
            isStartResizingCalled,
            $container = $("#container");

        //act
        resizeController1._startResizing = function() {
            isStartResizingCalled = true;
        };
        resizeController1._columnHeadersView.render($container);
        resizeController1._columnsSeparatorView.render($container);
        resizeController2._columnsSeparatorView.render($("#container2"));

        //act
        resizeController1._$parentContainer.trigger("dxpointerdown");

        //assert
        assert.ok(isStartResizingCalled);
    });

    QUnit.test('Unsubscribe and subscribe to dxpointerup for columnsSeparatorView_T136595', function(assert) {
        //arrange
        var resizeController1 = this.createColumnsResizerViewController(),
            resizeController2 = this.createColumnsResizerViewController(),
            isEndResizingCalled,
            $container = $("#container");

        //act
        resizeController1._endResizing = function() {
            isEndResizingCalled = true;
        };

        resizeController1._columnHeadersView.render($container);
        resizeController1._columnsSeparatorView.render($container);
        resizeController2._columnsSeparatorView.render($("#container2"));

        //act
        resizeController1._columnsSeparatorView.element().trigger("dxpointerup");

        //assert
        assert.ok(isEndResizingCalled);
    });

    QUnit.test('Unsubscribe and subscribe to dxpointerup for document element_T136595', function(assert) {
        //arrange
        var resizeController1 = this.createColumnsResizerViewController(),
            resizeController2 = this.createColumnsResizerViewController(),
            isEndResizingCalled,
            $container = $("#container");

        //act
        resizeController1._endResizing = function() {
            isEndResizingCalled = true;
        };

        resizeController1._columnHeadersView.render($container);
        resizeController1._columnsSeparatorView.render($container);
        resizeController2._columnsSeparatorView.render($("#container2"));

        //act
        $(document).trigger("dxpointerup");

        //assert
        assert.ok(isEndResizingCalled);
    });

    QUnit.test('Set new width of column in the separatorMoving callback function', function(assert) {
        //arrange
        var resizeController = this.createColumnsResizerViewController();

        //act
        this.renderViews($("#container"));

        resizeController._isResizing = true;
        resizeController._targetPoint = { columnIndex: 0 };
        resizeController._setupResizingInfo(-9850);
        resizeController._moveSeparator(getJQueryEvent({
            data: resizeController,
            type: 'mousemove',
            pageX: -9840
        }));

        //assert
        assert.deepEqual(resizeController._columnsController.updateOptions, [
            { columnIndex: 0, optionName: "visibleWidth", optionValue: undefined },
            { columnIndex: 0, optionName: "width", optionValue: 160 },
            { columnIndex: 1, optionName: "visibleWidth", optionValue: undefined },
            { columnIndex: 1, optionName: "width", optionValue: 140 }
        ], 'update column options after resizing');
    });

    QUnit.test('Set new width of column in the separatorMoving callback function when adaptColumnWidthByRatio enabled', function(assert) {
        //arrange
        var resizeController = this.createColumnsResizerViewController();

        $("#container").width(200);
        this.options.columns[0].width = undefined;
        this.options.columns[1].width = undefined;
        //act
        this.renderViews($("#container"));

        this.options.adaptColumnWidthByRatio = true;

        resizeController._isResizing = true;
        resizeController._targetPoint = { columnIndex: 0 };
        resizeController._setupResizingInfo(-9850);
        resizeController._moveSeparator(getJQueryEvent({
            data: resizeController,
            type: 'mousemove',
            pageX: -9840
        }));

        //assert
        assert.equal($("#container").width(), 200);

        assert.deepEqual(resizeController._columnsController.updateOptions, [
            { columnIndex: 0, optionName: "visibleWidth", optionValue: 110 },
            { columnIndex: 0, optionName: "width", optionValue: "55.000%" },
            { columnIndex: 1, optionName: "visibleWidth", optionValue: 90 },
            { columnIndex: 1, optionName: "width", optionValue: "45.000%" }
        ], 'update column options after resizing');
    });

    QUnit.test('Set new width of column in the separatorMoving callback function when adaptColumnWidthByRatio enabled and columnAutoWidth enabled', function(assert) {
        //arrange
        var resizeController = this.createColumnsResizerViewController();

        $("#container").width(200);
        this.options.columns[0].width = undefined;
        this.options.columns[1].width = undefined;
        this.options.adaptColumnWidthByRatio = true;
        this.options.columnAutoWidth = true;

        //act
        this.renderViews($("#container"));

        resizeController._isResizing = true;
        resizeController._targetPoint = { columnIndex: 0 };
        resizeController._setupResizingInfo(-9850);
        resizeController._moveSeparator(getJQueryEvent({
            data: resizeController,
            type: 'mousemove',
            pageX: -9840
        }));

        //assert
        assert.equal($("#container").width(), 200);

        assert.deepEqual(resizeController._columnsController.updateOptions, [
            { columnIndex: 0, optionName: "visibleWidth", optionValue: undefined },
            { columnIndex: 0, optionName: "width", optionValue: 110 },
            { columnIndex: 1, optionName: "visibleWidth", optionValue: undefined },
            { columnIndex: 1, optionName: "width", optionValue: 90 }
        ], 'update column options after resizing');
    });

    QUnit.test('Set new width of column in the separatorMoving callback function when adaptColumnWidthByRatio disabled and widths by percent', function(assert) {
        //arrange
        var resizeController = this.createColumnsResizerViewController();

        $("#container").width(200);
        this.options.columns[0].width = "50%";
        this.options.columns[1].width = "50%";
        //act
        this.renderViews($("#container"));

        this.options.adaptColumnWidthByRatio = false;

        resizeController._isResizing = true;
        resizeController._targetPoint = { columnIndex: 0 };
        resizeController._setupResizingInfo(-9850);
        resizeController._moveSeparator(getJQueryEvent({
            data: resizeController,
            type: 'mousemove',
            pageX: -9840
        }));

        //assert
        assert.equal($("#container").width(), 200);

        assert.deepEqual(resizeController._columnsController.updateOptions, [
            { columnIndex: 0, optionName: "visibleWidth", optionValue: 110 },
            { columnIndex: 0, optionName: "width", optionValue: "55.000%" },
            { columnIndex: 1, optionName: "visibleWidth", optionValue: 90 },
            { columnIndex: 1, optionName: "width", optionValue: "45.000%" }
        ], 'update column options after resizing');
    });


    QUnit.test('Set new width of column in the separatorMoving callback function RTL', function(assert) {
        //arrange
        var resizeController = this.createColumnsResizerViewController();
        this.options.rtlEnabled = true;
        $("#container").css('direction', 'rtl');
        //act
        this.renderViews($("#container"));

        resizeController._isResizing = true;
        resizeController._targetPoint = { columnIndex: 0 };
        resizeController._setupResizingInfo(-9850);
        resizeController._moveSeparator(getJQueryEvent({
            data: resizeController,
            type: 'mousemove',
            pageX: -9840
        }));

        //assert
        assert.deepEqual(resizeController._columnsController.updateOptions, [
            { columnIndex: 0, optionName: "visibleWidth", optionValue: undefined },
            { columnIndex: 0, optionName: "width", optionValue: 140 },
            { columnIndex: 1, optionName: "visibleWidth", optionValue: undefined },
            { columnIndex: 1, optionName: "width", optionValue: 160 },
        ], 'update column options after resizing');
    });

    QUnit.test('Set new width of column in the separatorMoving callback function if RTL and columnResizingMode is widget', function(assert) {
        //arrange
        var resizeController = this.createColumnsResizerViewController();
        this.options.rtlEnabled = true;
        this.options.columnResizingMode = "widget";
        this.component.updateDimensions = $.noop;
        $("#container").css('direction', 'rtl');
        //act
        this.renderViews($("#container"));

        resizeController._isResizing = true;
        resizeController._targetPoint = { columnIndex: 0 };
        resizeController._setupResizingInfo(-9850);
        resizeController._moveSeparator(getJQueryEvent({
            data: resizeController,
            type: 'mousemove',
            pageX: -9840
        }));

        //assert
        assert.deepEqual(resizeController._columnsController.updateOptions, [
            { columnIndex: 0, optionName: "visibleWidth", optionValue: undefined },
            { columnIndex: 0, optionName: "width", optionValue: 160 }
        ], 'update column options after resizing');
    });

    QUnit.test('Set new width of column for float client x position', function(assert) {
        //arrange
        var resizeController = this.createColumnsResizerViewController();

        //act
        this.renderViews($("#container"));
        resizeController._isResizing = true;
        resizeController._targetPoint = { columnIndex: 0 };
        resizeController._setupResizingInfo(-9850);
        resizeController._moveSeparator(getJQueryEvent({
            data: resizeController,
            type: 'mousemove',
            pageX: -9840.5
        }));

        //assert
        assert.deepEqual(resizeController._columnsController.updateOptions, [
            { columnIndex: 0, optionName: "visibleWidth", optionValue: undefined },
            { columnIndex: 0, optionName: "width", optionValue: 159 },
            { columnIndex: 1, optionName: "visibleWidth", optionValue: undefined },
            { columnIndex: 1, optionName: "width", optionValue: 140 }
        ], 'update column options after resizing');
    });

    QUnit.test('Separator is not moving if position by X less separator width', function(assert) {
        //arrange
        var resizeController = this.createColumnsResizerViewController();

        //act
        this.renderViews($("#container"));
        resizeController._isResizing = true;
        resizeController._targetPoint = { columnIndex: 0 };
        resizeController._setupResizingInfo(-9850);
        resizeController._moveSeparator(getJQueryEvent({
            data: resizeController,
            type: 'mousemove',
            pageX: -10000
        }));

        //assert
        assert.ok(resizeController._columnsController.updateOptions.length === 0, 'cancel moving');
    });

    QUnit.test('Headers element is null in startResizing_B239012', function(assert) {
        //arrange
        var resizeController = this.createColumnsResizerViewController([]);

        //act
        this.renderViews($("#container"));
        resizeController._targetPoint = { columnIndex: 0 };
        resizeController._isReadyResizing = true;
        $(".dx-datagrid").trigger('mousedown');

        //assert
        assert.equal(resizeController._columnHeadersView.getColumnCount(), 0, 'headers count');
    });

    QUnit.test('Headers element is null in endResizing_B239012', function(assert) {
        //arrange
        var resizeController = this.createColumnsResizerViewController([]);

        //act
        this.renderViews($("#container"));
        resizeController._targetPoint = { columnIndex: 0 };
        resizeController._isResizing = true;
        resizeController._endResizing({
            jQueryEvent: {
                data: resizeController
            }
        });

        //assert
        assert.equal(resizeController._columnHeadersView.getColumnCount(), 0, 'headers count');
    });

    QUnit.test('Set valid x position when endResizing is called and column with checkbox', function(assert) {
        this.component._controllers.data = new MockDataController({
            selection: { mode: 'multiple', showCheckBoxesMode: 'always' },
            pageCount: 1,
            pageIndex: 0,
            items: [{ values: {} }]
        });

        //arrange
        var resizeController = this.createColumnsResizerViewController([
            { caption: 'Column 1', width: '125px', allowResizing: false },
            { caption: 'Column 2', width: '125px' },
            { caption: 'Column 3', width: '125px' },
            { caption: 'Column 4', width: '125px' }
        ]);

        //act
        var $container = $("#container").width(500),
            args = {
                jQueryEvent: {
                    data: resizeController,
                    pageY: -9995
                }
            };

        this.renderViews($container);
        resizeController._targetPoint = { columnIndex: 0 };
        resizeController._isResizing = true;
        resizeController._endResizing(args);

        resizeController._$parentContainer = $container;
        resizeController._moveSeparator(args);

        //assert
        assert.deepEqual(resizeController._pointsByColumns, [
            { x: -9750, y: -10000, columnIndex: 1, index: 2 },
            { x: -9625, y: -10000, columnIndex: 2, index: 3 }
        ], 'column index 0');
    });

    QUnit.test('ColumnsSeparator is not initialized when showColumnHeaders is false', function(assert) {
        //arrange
        this.createColumnsResizerViewController();
        var $container = $("#container");

        //act
        this.options.showColumnHeaders = false;
        this.commonColumnSettings.allowReordering = true;
        this.renderViews($container);

        //assert
        assert.ok($container.find(".dx-datagrid-columns-separator").length === 0, "columnsSeparator is null");
    });

    QUnit.test('Update height of separator when caption of header is wrapped', function(assert) {
        this.component._controllers.tablePosition = new columnResizingReordering.TablePositionViewController(this.component);

        //arrange
        var resizeController = this.createColumnsResizerViewController(),
            $container = $("#container");

        //act
        $container.height(500);

        //act
        this.component._controllers.tablePosition.init();
        this.renderViews($container);

        resizeController._isResizing = true;
        resizeController._targetPoint = { columnIndex: 0 };
        resizeController._columnsSeparatorView.height(0);
        resizeController._setupResizingInfo(-9850);
        resizeController._moveSeparator(getJQueryEvent({
            data: resizeController,
            type: 'mousemove',
            pageX: -9840
        }));

        assert.ok(resizeController._columnsSeparatorView.height() > 0, 'new columnsSeparator height');
    });

    QUnit.test('Update height of separator on resize', function(assert) {
        this.component._controllers.tablePosition = new columnResizingReordering.TablePositionViewController(this.component);

        //arrange
        var resizeController = this.createColumnsResizerViewController(),
            $container = $("#container").height(500);

        //act
        this.component._controllers.tablePosition.init();
        this.renderViews($container);
        resizeController._columnsSeparatorView.height(0);
        resizeController._rowsView.resize();

        //assert
        assert.ok(resizeController._columnsSeparatorView.height() > 0, 'new columnsSeparator height');
    });

    QUnit.test('Update pointsByColumns on resize', function(assert) {
        //arrange
        var resizeController = this.createColumnsResizerViewController(),
            $container = $("#container").height(500);

        //act
        this.renderViews($container);
        resizeController._pointsByColumns = [];
        resizeController._columnHeadersView.resize();
        resizeController.pointsByColumns();

        //assert
        assert.ok(resizeController._pointsByColumns.length > 0, 'pointsByColumns is updated');
    });

    QUnit.test('Update height of separator by headers and rows height with pager', function(assert) {
        //arrange
        this.component._controllers.tablePosition = new columnResizingReordering.TablePositionViewController(this.component);
        this.component._views.pagerView.getHeight = function() {
            return 1;
        };

        var testElement = $('#container').css({
                height: 500,
                width: 500
            }),
            resizeController = this.createColumnsResizerViewController();

        //act
        this.component._controllers.tablePosition.init();
        this.renderViews(testElement);
        resizeController._tablePositionController.update();

        //assert
        assert.equal(resizeController._columnsSeparatorView.height(), resizeController._columnHeadersView.getHeight() + resizeController._rowsView.height(), 'result height of separator');
    });

    QUnit.test('Update a pointsByColumns when new column is added', function(assert) {
        //arrange
        var testElement = $('#container').css({
                height: 500,
                width: 500
            }),
            resizeController = this.createColumnsResizerViewController([
                { caption: 'Column 1', width: '125px' },
                { caption: 'Column 2', width: '305px' }
            ]),
            columnsController = this.component._controllers.columns,
            dataController = this.component._controllers.data;

        columnsController.columnsChanged.add(function(e) {
            dataController.changed.fire([
                {
                    changeType: 'refresh',
                    items: dataController.items()
                }
            ]);
        });

        //act
        this.renderViews(testElement);
        resizeController._columnHeadersView._headersHeight = resizeController._columnHeadersView.getHeight();
        resizeController._columnsController.startSelectionWithCheckboxes({ width: '70px', visible: true, allowResizing: false });

        //assert
        assert.notOk(resizeController._pointsByColumns, "points by columns are lost");

        //act
        resizeController._$parentContainer = testElement;
        resizeController._moveSeparator({
            jQueryEvent: {
                data: resizeController,
                pageY: -9995
            }
        });

        //assert
        assert.deepEqual(resizeController._pointsByColumns, [
            { x: -9805, y: -10000, columnIndex: 1, index: 2 }
        ], 'new pointsByColumns');
    });

    QUnit.test('Update height of separator when there is band columns', function(assert) {
        //arrange
        var columnsSeparatorHeight;

        this.component._controllers.tablePosition = new columnResizingReordering.TablePositionViewController(this.component);
        var resizeController = this.createColumnsResizerViewController([
            [
                        { caption: 'Column 1', width: '125px', rowspan: 2, index: 0, allowResizing: true },
                        { caption: "Band Column 1", isBand: true, colspan: 2, index: 1, allowResizing: true },
                        { caption: 'Column 4', width: '125px', rowspan: 2, index: 4, allowResizing: true }
            ],
            [
                        { caption: 'Column 2', width: '125px', ownerBand: "Band Column 1", index: 2, allowResizing: true },
                        { caption: 'Column 3', width: '125px', ownerBand: "Band Column 1", index: 3, allowResizing: true }
            ],
            [
                        { caption: 'Column 1', width: '125px', rowspan: 2, rowIndex: 0, index: 0, allowResizing: true },
                        { caption: 'Column 2', width: '125px', ownerBand: "Band Column 1", rowIndex: 1, index: 2, allowResizing: true },
                        { caption: 'Column 3', width: '125px', ownerBand: "Band Column 1", rowIndex: 1, index: 3, allowResizing: true },
                        { caption: 'Column 4', width: '125px', rowspan: 2, rowIndex: 0, index: 4, allowResizing: true }
            ]
            ]),
            $container = $("#container").height(500);

        this.component._controllers.tablePosition.init();
        this.renderViews($container);
        this.component._controllers.tablePosition.update();

        //assert
        columnsSeparatorHeight = resizeController._columnsSeparatorView.height();
        assert.ok(columnsSeparatorHeight > 0, 'columnsSeparator height');
        assert.equal(parseInt(resizeController._columnsSeparatorView.element().css("top")), 0, 'columnsSeparator top');

        //act
        resizeController._moveSeparator(getJQueryEvent({
            data: resizeController,
            type: 'mousemove',
            pageX: -9750,
            pageY: -9960
        }));

        //assert
        assert.ok(resizeController._columnsSeparatorView.height() < columnsSeparatorHeight, 'new columnsSeparator height');
        assert.ok(parseInt(resizeController._columnsSeparatorView.element().css("top")) > 0, 'new columnsSeparator top');
    });

    QUnit.test('Start resizing by mousedown', function(assert) {
        //arrange
        var callPositionChanged,
            resizeController = this.createColumnsResizerViewController();

        this.component._controllers.tablePosition.positionChanged.add(function() {
            callPositionChanged = true;
        });

        //act
        this.renderViews($("#container"));
        resizeController._isReadyResizing = true;
        resizeController._targetPoint = { x: -9750, columnIndex: 1, index: 2 };
        resizeController._startResizing({
            jQueryEvent: {
                data: resizeController,
                type: 'mousedown',
                pageX: -9750,
                preventDefault: function() {
                    return true;
                },
                stopPropagation: noop,
                target: $('.dx-columns-separator')
            }
        });

        //assert
        assert.ok(callPositionChanged, 'call positionChanged');
        assert.equal(resizeController._testColumnIndex, 1, 'column index after startResizing is called');
        assert.ok(resizeController._columnsSeparatorView._isShown, 'columnsSeparator is shown');
        assert.ok(resizeController._isResizing, 'columnsResizer is resizing');
    });

    QUnit.test('No start resizing while cell is opened for editing in "cell" mode. T450598', function(assert) {
        //arrange
        var callPositionChanged = sinon.stub(),
            resizeController = this.createColumnsResizerViewController();

        this.component._controllers.tablePosition.positionChanged.add(callPositionChanged);

        //act
        this.renderViews($("#container"));

        this.component._controllers.editing._isEditing = true;
        function startResizing() {
            resizeController._isReadyResizing = true;
            resizeController._targetPoint = { x: -9750, columnIndex: 1, index: 2 };
            resizeController._startResizing({
                jQueryEvent: {
                    data: resizeController,
                    type: 'mousedown',
                    pageX: -9750,
                    preventDefault: function() {
                        assert.ok(false, "preventDefault should not be called");
                        return true;
                    },
                    stopPropagation: noop,
                    target: $('.dx-columns-separator')
                }
            });
        }

        this.options["editing.mode"] = "cell";
        startResizing();

        //assert
        assert.ok(!callPositionChanged.called, 'positionChanged should not be called');
    });

    QUnit.test('No start resizing while cell is opened for editing in "batch" mode. T450598', function(assert) {
        //arrange
        var callPositionChanged = sinon.stub(),
            resizeController = this.createColumnsResizerViewController();

        this.component._controllers.tablePosition.positionChanged.add(callPositionChanged);

        //act
        this.renderViews($("#container"));

        this.component._controllers.editing._isEditing = true;
        function startResizing() {
            resizeController._isReadyResizing = true;
            resizeController._targetPoint = { x: -9750, columnIndex: 1, index: 2 };
            resizeController._startResizing({
                jQueryEvent: {
                    data: resizeController,
                    type: 'mousedown',
                    pageX: -9750,
                    preventDefault: function() {
                        assert.ok(false, "preventDefault should not be called");
                        return true;
                    },
                    stopPropagation: noop,
                    target: $('.dx-columns-separator')
                }
            });
        }

        this.options["editing.mode"] = "batch";
        startResizing();

        //assert
        assert.ok(!callPositionChanged.called, 'positionChanged should not be called');
    });

    QUnit.test('Start resizing while cell is opened for editing in "row" mode. T450598', function(assert) {
        //arrange
        var callPositionChanged = sinon.stub(),
            resizeController = this.createColumnsResizerViewController();

        this.component._controllers.tablePosition.positionChanged.add(callPositionChanged);

        //act
        this.renderViews($("#container"));

        this.component._controllers.editing._isEditing = true;
        function startResizing() {
            resizeController._isReadyResizing = true;
            resizeController._targetPoint = { x: -9750, columnIndex: 1, index: 2 };
            resizeController._startResizing({
                jQueryEvent: {
                    data: resizeController,
                    type: 'mousedown',
                    pageX: -9750,
                    preventDefault: function() {
                        assert.ok(true, "preventDefault should not be called");
                        return true;
                    },
                    stopPropagation: noop,
                    target: $('.dx-columns-separator')
                }
            });
        }

        this.options["editing.mode"] = "row";
        startResizing();

        //assert
        assert.strictEqual(callPositionChanged.callCount, 1, 'positionChanged should be called');
    });

    QUnit.test('Not start resizing by touchstart', function(assert) {
        //arrange
        var resizeController = this.createColumnsResizerViewController();

        //act
        this.renderViews($("#container"));

        resizeController._startResizing(getJQueryEvent({
            pageX: -9750,
            data: resizeController,
            type: 'touchstart',
            target: $('.dx-columns-separator')
        }));

        //assert
        assert.ok(!resizeController._isReadyResizing, 'resizing is not ready');
    });

    QUnit.test('Start resizing by touchstart', function(assert) {
        //arrange
        var resizeController = this.createColumnsResizerViewController([
            { caption: 'Column 1', width: '125px' },
            { caption: 'Column 2', width: '125px' },
            { caption: 'Column 3', width: '125px' },
            { caption: 'Column 4', width: '125px' }
        ]);

        //act
        this.renderViews($("#container"));
        resizeController._startResizing(getJQueryEvent({
            pageY: -9995,
            pageX: -9750,
            data: resizeController,
            type: 'touchstart',
            target: $('.dx-columns-separator')
        }));

        //assert
        assert.deepEqual(resizeController._targetPoint, { x: -9750, y: -10000, columnIndex: 1, index: 2 }, 'targetPoint');
        assert.equal(resizeController._columnsSeparatorView._testPosX, -9750 - resizeController._columnsSeparatorView.width() / 2, 'posX of columnsSeparator');
        assert.ok(resizeController._isReadyResizing, 'resizing is ready');
    });

    QUnit.test('Points by columns is generated when resizing is started by touch event', function(assert) {
        //arrange
        var resizeController = this.createColumnsResizerViewController([
            { caption: 'Column 1', width: '125px' },
            { caption: 'Column 2', width: '125px' },
            { caption: 'Column 3', width: '125px' },
            { caption: 'Column 4', width: '125px' }
        ]);

        //act
        this.renderViews($("#container").css({ width: 500, height: 500 }));

        //assert
        assert.notOk(resizeController._pointsByColumns, "pointsByColumns is null");

        resizeController._startResizing(getJQueryEvent({
            pageY: -9995,
            pageX: -9750,
            data: resizeController,
            type: 'touchstart',
            target: $('.dx-columns-separator')
        }));

        //assert
        assert.deepEqual(resizeController._pointsByColumns, [
            { "columnIndex": 0, "index": 1, "x": -9875, "y": -10000 },
            { "columnIndex": 1, "index": 2, "x": -9750, "y": -10000 },
            { "columnIndex": 2, "index": 3, "x": -9625, "y": -10000 }], "pointsByColumns is generated");
    });

    QUnit.test("Stop propagation is called on the start resizing method", function(assert) {
        //arrange
        var resizeController = this.createColumnsResizerViewController(),
            isStopPropagationCalled;

        //act
        this.renderViews($("#container"));
        resizeController._targetPoint = { x: -9750, columnIndex: 1, index: 2 };
        resizeController._isReadyResizing = true;
        resizeController._pointsByColumns = [
            { x: -9875, columnIndex: 0, index: 1 },
            { x: -9750, columnIndex: 1, index: 2 },
            { x: -9625, columnIndex: 2, index: 3 }
        ];
        resizeController._startResizing(getJQueryEvent({
            pageY: -9995,
            pageX: -9750,
            data: resizeController,
            target: $('.dx-columns-separator'),
            stopPropagation: function() {
                isStopPropagationCalled = true;
            }
        }));

        //assert
        assert.ok(isStopPropagationCalled);
    });

    QUnit.test("Stop propagation is not called on startResizing when resizing is not ready", function(assert) {
        //arrange
        var resizeController = this.createColumnsResizerViewController(),
            isStopPropagationCalled;

        //act
        this.renderViews($("#container"));
        resizeController._pointsByColumns = [
            { x: -9875, columnIndex: 0, index: 1 },
            { x: -9750, columnIndex: 1, index: 2 },
            { x: -9625, columnIndex: 2, index: 3 }
        ];
        resizeController._startResizing(getJQueryEvent({
            pageY: -9995,
            pageX: -9750,
            data: resizeController,
            target: $('.dx-columns-separator'),
            stopPropagation: function() {
                isStopPropagationCalled = true;
            }
        }));

        //assert
        assert.ok(!isStopPropagationCalled);
    });

    QUnit.test('Resizing is not started by touchstart', function(assert) {
        //arrange
        var resizeController = this.createColumnsResizerViewController();

        //act
        this.renderViews($("#container"));

        resizeController._pointsByColumns = [
            { x: -9875, columnIndex: 0, index: 1 },
            { x: -9750, columnIndex: 1, index: 2 },
            { x: -9625, columnIndex: 2, index: 3 }
        ];

        resizeController._isReadyResizing = true;

        resizeController._startResizing(getJQueryEvent({
            pageY: -10000 + resizeController._columnHeadersView.getHeadersRowHeight() + 1,
            pageX: -9750,
            data: resizeController,
            type: 'touchstart',
            target: $('.dx-columns-separator')
        }));

        //assert
        assert.ok(!resizeController._isReadyResizing, 'resizing is not ready');
    });

    QUnit.test('Move separator when resizing is ready', function(assert) {
        //arrange
        var resizeController = this.createColumnsResizerViewController();

        //act
        this.renderViews($("#container"));
        resizeController._pointsByColumns = [
            { x: -9875, columnIndex: 0, index: 1, y: -9995 },
            { x: -9750, columnIndex: 1, index: 2, y: -9995 },
            { x: -9625, columnIndex: 2, index: 3, y: -9995 }
        ];
        resizeController._columnsSeparatorView.height(100);
        resizeController._moveSeparator(getJQueryEvent({
            data: resizeController,
            type: 'mousedown',
            pageX: -9750,
            pageY: -9995
        }));

        //assert
        assert.ok(resizeController._isReadyResizing, 'resizing is ready');
        assert.equal(resizeController._columnsSeparatorView._testCursorName, 'col-resize', 'cursorName');
        assert.equal(resizeController._columnsSeparatorView._testPosX, -9750 - resizeController._columnsSeparatorView.width() / 2, 'posX of columnsSeparator');
        assert.deepEqual(resizeController._targetPoint, { x: -9750, columnIndex: 1, index: 2, y: -9995 }, 'targetPoint');
    });

    QUnit.test('Get the last one point if they are have the same horizontal position at the start', function(assert) {
        //arrange
        var resizeController = this.createColumnsResizerViewController();

        //act
        this.renderViews($("#container"));
        resizeController._pointsByColumns = [
            { x: -9875, columnIndex: 0, index: 1, y: -9995 },
            { x: -9875, columnIndex: 1, index: 2, y: -9995 },
            { x: -9625, columnIndex: 2, index: 3, y: -9995 }
        ];
        resizeController._columnsSeparatorView.height(100);
        resizeController._moveSeparator(getJQueryEvent({
            data: resizeController,
            type: 'mousedown',
            pageX: -9875,
            pageY: -9995
        }));

        //assert
        assert.deepEqual(resizeController._targetPoint, { x: -9875, columnIndex: 1, index: 2, y: -9995 }, 'the second point is a targetPoint');
    });

    QUnit.test('Get the first one point if they are have the same horizontal position at the end', function(assert) {
        //arrange
        var resizeController = this.createColumnsResizerViewController();

        //act
        this.renderViews($("#container"));
        resizeController._pointsByColumns = [
            { x: -9875, columnIndex: 0, index: 1, y: -9995 },
            { x: -9625, columnIndex: 1, index: 2, y: -9995 },
            { x: -9625, columnIndex: 2, index: 3, y: -9995 }
        ];
        resizeController._columnsSeparatorView.height(100);
        resizeController._moveSeparator(getJQueryEvent({
            data: resizeController,
            type: 'mousedown',
            pageX: -9625,
            pageY: -9995
        }));

        //assert
        assert.deepEqual(resizeController._targetPoint, { x: -9625, columnIndex: 1, index: 2, y: -9995 }, 'the second point is a targetPoint');
    });

    QUnit.test('Cursor is not changed when resizing is ready_T406910', function(assert) {
        //arrange
        var resizeController = this.createColumnsResizerViewController(),
            cursorNames = [];

        //act
        this.renderViews($("#container"));
        resizeController._pointsByColumns = [
            { x: -9875, columnIndex: 0, index: 1, y: -9995 },
            { x: -9750, columnIndex: 1, index: 2, y: -9995 },
            { x: -9625, columnIndex: 2, index: 3, y: -9995 }
        ];
        resizeController._columnsSeparatorView.height(100);
        resizeController._columnsSeparatorView.changeCursor = function(cursorName) {
            cursorNames.push(cursorName);
        };
        var options = {
            data: resizeController,
            type: 'mousedown',
            pageX: -9750,
            pageY: -9995
        };
        resizeController._moveSeparator(getJQueryEvent(options));
        resizeController._moveSeparator(getJQueryEvent(options));
        resizeController._moveSeparator(getJQueryEvent(options));

        //assert
        assert.equal(cursorNames.length, 3, "changeCursor called count");
        assert.deepEqual(cursorNames, ["col-resize", "col-resize", "col-resize"], "cursor name is not changed");
    });

    QUnit.test('Move separator when resizing is not ready', function(assert) {
        //arrange
        var resizeController = this.createColumnsResizerViewController();

        //act
        this.renderViews($("#container"));
        resizeController._pointsByColumns = [
            { x: -9875, columnIndex: 0, index: 1 },
            { x: -9750, columnIndex: 1, index: 2 },
            { x: -9625, columnIndex: 2, index: 3 }
        ];
        resizeController._columnsSeparatorView.height(100);

        resizeController._isReadyResizing = true;
        resizeController._columnsSeparatorView.changeCursor("col-resize");

        resizeController._moveSeparator(getJQueryEvent({
            data: resizeController,
            type: 'mousedown',
            pageX: -9750,
            pageY: -10000 + resizeController._columnHeadersView.getHeadersRowHeight() + 1
        }));

        //assert
        assert.ok(!resizeController._isReadyResizing, 'resizing is not ready');
        assert.equal(resizeController._columnsSeparatorView._testCursorName, '', 'cursorName');
        assert.equal(resizeController._pointsByColumns, null, "points by columns is reset");
    });

    QUnit.test('Move separator when width of column is changed', function(assert) {
        //arrange
        var resizeController = this.createColumnsResizerViewController(),
            posX,
            testPosX,
            $container = $("#container").width('300px');

        //act
        this.renderViews($container);
        resizeController._updateColumnsWidthIfNeeded = function(posX) {
            testPosX = posX;
            return true;
        };
        resizeController._isResizing = true;
        resizeController._targetPoint = { x: -9850, columnIndex: 1, index: 2 };
        resizeController._resizingInfo = { startPosX: -9847, currentColumnIndex: 0 };
        resizeController._columnHeadersView.setColumnWidths([this.options.columns[0].width + 7, this.options.columns[1].width - 7]);
        resizeController._moveSeparator(getJQueryEvent({
            data: resizeController,
            type: 'mousemove',
            pageX: -9840
        }));

        //assert
        posX = resizeController._targetPoint.x + (-9840 - resizeController._resizingInfo.startPosX);
        assert.equal(resizeController._columnsSeparatorView._testPosX, posX, 'posX of columnsSeparator');
        assert.equal(testPosX, -9840, "posX");
    });

    QUnit.test("Points by columns are updated only once when width of column is changed", function(assert) {
        //arrange
        var resizeController = this.createColumnsResizerViewController(),
            calledCounter = 0,
            generatePointsByColumns = resizeController._generatePointsByColumns,
            $container = $("#container").width('300px');

        //act
        this.renderViews($container);
        resizeController._generatePointsByColumns = function() {
            calledCounter++;
            $.proxy(generatePointsByColumns, resizeController)();
        };
        resizeController._isResizing = true;
        resizeController.pointsByColumns();
        resizeController._targetPoint = { x: -9750, columnIndex: 1, index: 2 };
        resizeController._resizingInfo = { startPosX: -9747 };
        resizeController._moveSeparator(getJQueryEvent({
            data: resizeController,
            type: 'mousemove',
            pageX: -9740
        }));

        resizeController._columnHeadersView.resizeCompleted.fire();

        resizeController._moveSeparator(getJQueryEvent({
            data: resizeController,
            type: 'mousemove',
            pageX: -9738
        }));

        resizeController._columnHeadersView.resizeCompleted.fire();

        //assert
        assert.equal(calledCounter, 1);
    });

    QUnit.test("Points by columns are updated when the parent offset parameters are changed", function(assert) {
        //arrange
        var resizeController = this.createColumnsResizerViewController(),
            $container = $("#container").width('300px');

        this.renderViews($container);
        resizeController.pointsByColumns();
        resizeController._targetPoint = { x: -9750, columnIndex: 1, index: 2 };
        resizeController._resizingInfo = { startPosX: -9747 };
        resizeController._isHeadersRowArea = function() {
            return true;
        };
        resizeController._moveSeparator(getJQueryEvent({
            data: resizeController,
            type: 'mousemove',
            pageX: -9740
        }));

        //act
        sinon.spy(resizeController, "_generatePointsByColumns");
        resizeController._previousParentOffset = { left: 1, top: 10 };
        resizeController._moveSeparator(getJQueryEvent({
            data: resizeController,
            type: 'mousemove',
            pageX: -9738
        }));

        //assert
        assert.equal(resizeController._generatePointsByColumns.callCount, 1);
    });

    QUnit.test('Separator is not moving if his position by X more rootElement width and less rootElement offset left', function(assert) {
        //arrange
        var resizeController = this.createColumnsResizerViewController(),
            $container = $("#container").css({ width: '300px', 'margin-left': '10px' });

        //act
        this.renderViews($container);
        resizeController._updateColumnsWidthIfNeeded = function(columnIndex, posX) {
            return true;
        };
        resizeController._isResizing = true;
        resizeController._targetPoint = { x: -9875, columnIndex: 0, index: 1 };
        resizeController._moveSeparator(getJQueryEvent({
            data: resizeController,
            type: 'mousemove',
            pageX: -9600
        }));

        //assert
        assert.ok(!resizeController._columnsSeparatorView._testPosX, 'posX of columnsSeparator');

        //act
        resizeController._moveSeparator(getJQueryEvent({
            data: resizeController,
            type: 'mousemove',
            pageX: -10001
        }));

        //assert
        assert.ok(!resizeController._columnsSeparatorView._testPosX, 'posX of columnsSeparator');
    });

    QUnit.test('End resizing', function(assert) {
        //arrange
        var resizeController = this.createColumnsResizerViewController(),
            args = {
                jQueryEvent: {
                    data: resizeController,
                    pageY: -9995
                }
            },
            isPointsUpdated;

        //act
        this.renderViews($("#container").width(750));

        resizeController._columnsSeparatorView.changeCursor('col-resize');
        resizeController._targetPoint = { x: -9750, columnIndex: 1, index: 2 };
        resizeController._isReadyResizing = true;
        resizeController._isResizing = true;

        resizeController._generatePointsByColumns = function() {
            isPointsUpdated = true;
        };

        resizeController._endResizing(args);
        resizeController._moveSeparator(args);

        //assert
        assert.ok(isPointsUpdated, "points by columns is updated");
        assert.ok(!resizeController._columnsSeparatorView._isShown, 'columnsSeparator is hidden');
        assert.ok(resizeController._columnsSeparatorView._testCursorName === '', 'cursor is down');
        assert.ok(!resizeController._isResizing, 'columnsResizer is not resized');
        assert.ok(!resizeController._isReadyResizing, 'columnsResizer is not ready resized');
    });

    QUnit.test('Separator is not moving when the cursor is located out of separator top side', function(assert) {
        //arrange
        this.component._views.columnsSeparatorView = new MockColumnsSeparatorView($("#container"), true);
        var resizeController = this.createColumnsResizerViewController();

        resizeController._pointsByColumns = [
            { x: -9875, columnIndex: 0, index: 1 },
            { x: -9750, columnIndex: 1, index: 2 },
            { x: -9625, columnIndex: 2, index: 3 }
        ];

        //act
        this.renderViews($("#container"));
        resizeController._columnsSeparatorView.element().offset({
            top: 10,
            left: 10
        });
        resizeController._columnsSeparatorView.height(300);
        resizeController._moveSeparator(getJQueryEvent({
            data: resizeController,
            type: 'mousedown',
            pageX: -9750,
            pageY: 0
        }));

        //assert
        assert.ok(!resizeController._columnsSeparatorView._testPosX, 'moveByX is not called');
    });

    QUnit.test('Separator is not moving when the cursor is located out of separator bottom side', function(assert) {
        //arrange
        var resizeController = this.createColumnsResizerViewController();

        resizeController._pointsByColumns = [
            { x: -9875, columnIndex: 0, index: 1 },
            { x: -9750, columnIndex: 1, index: 2 },
            { x: -9625, columnIndex: 2, index: 3 }
        ];

        //act
        this.renderViews($("#container"));
        resizeController._columnsSeparatorView.element().offset({
            top: 10,
            left: 10
        });
        resizeController._columnsSeparatorView.height(300);
        resizeController._moveSeparator(getJQueryEvent({
            data: resizeController,
            type: 'mousedown',
            pageX: -9750,
            pageY: 350
        }));

        //assert
        assert.ok(!resizeController._columnsSeparatorView._testPosX, 'moveByX is not called');
    });

    QUnit.test("Grid view is resized when vertical scrollbar is not shown", function(assert) {
        //arrange
        var isGridViewResized = false,
            resizeController;

        this.component.updateDimensions = function() {
            isGridViewResized = true;
        };

        resizeController = this.createColumnsResizerViewController();

        resizeController._pointsByColumns = [
            { x: -9875, columnIndex: 0, index: 1 },
            { x: -9750, columnIndex: 1, index: 2 },
            { x: -9625, columnIndex: 2, index: 3 }
        ];

        resizeController._targetPoint = {
            x: -9825,
            columnIndex: 0
        };

        //act
        this.renderViews($("#container"));

        resizeController._isResizing = true;

        this.component._views.rowsView.getScrollbarWidth = function() {
            return 16;
        };

        resizeController._setupResizingInfo(-9850);

        resizeController._moveSeparator(getJQueryEvent({
            data: resizeController,
            type: 'mousedown',
            pageX: -9825,
            pageY: 0
        }));

        assert.ok(isGridViewResized, "grid view is resized");
    });

    QUnit.test("Grid view is resized when vertical scrollbar is shown", function(assert) {
        //arrange
        var isGridViewResized = false,
            resizeController;

        this.component.updateDimensions = function() {
            isGridViewResized = true;
        };

        this.component._views.rowsView.getScrollbarWidth = function() {
            return 16;
        };

        resizeController = this.createColumnsResizerViewController();

        resizeController._pointsByColumns = [
            { x: -9875, columnIndex: 0, index: 1 },
            { x: -9750, columnIndex: 1, index: 2 },
            { x: -9625, columnIndex: 2, index: 3 }
        ];

        //act
        this.renderViews($("#container"));

        resizeController._targetPoint = {
            x: -9825,
            columnIndex: 0
        };

        resizeController._isResizing = true;

        this.component._views.rowsView.getScrollbarWidth = function() {
            return 0;
        };

        resizeController._setupResizingInfo(-9850);

        resizeController._moveSeparator(getJQueryEvent({
            data: resizeController,
            type: 'mousedown',
            pageX: -9825,
            pageY: 0
        }));

        assert.ok(isGridViewResized, "grid view is resized");
    });

    QUnit.test("Grid view is not resized by move separator", function(assert) {
        //arrange
        var isGridViewResized = false,
            resizeController;

        this.component._views.gridView = {
            init: noop,
            resize: function() {
                isGridViewResized = true;
            },
            render: noop
        };

        resizeController = this.createColumnsResizerViewController();

        resizeController._pointsByColumns = [
            { x: -9875, columnIndex: 0, index: 1 },
            { x: -9750, columnIndex: 1, index: 2 },
            { x: -9625, columnIndex: 2, index: 3 }
        ];

        //act
        this.renderViews($("#container"));

        resizeController._targetPoint = {
            x: -9825,
            columnIndex: 0
        };

        resizeController._isResizing = true;

        resizeController._setupResizingInfo(-9850);

        resizeController._moveSeparator(getJQueryEvent({
            data: resizeController,
            type: 'mousedown',
            pageX: -9825,
            pageY: 0
        }));

        assert.ok(!isGridViewResized, "grid view is not resized");
    });

    QUnit.test("Update height of the free space row when text is wrapped in a cell", function(assert) {
        //arrange
        var isFreeSpaceRowHeightUpdated,
            tablePositionController = new columnResizingReordering.TablePositionViewController(this.component),
            resizeController;

        this.component._controllers.tablePosition = tablePositionController;
        tablePositionController.init();

        resizeController = this.createColumnsResizerViewController();

        resizeController._pointsByColumns = [
            { x: -9875, columnIndex: 0, index: 1 },
            { x: -9750, columnIndex: 1, index: 2 },
            { x: -9625, columnIndex: 2, index: 3 }
        ];

        //act
        this.renderViews($("#container"));

        resizeController._targetPoint = {
            x: -9825,
            columnIndex: 0
        };

        resizeController._isResizing = true;

        this.component._views.rowsView.updateFreeSpaceRowHeight = function() {
            isFreeSpaceRowHeightUpdated = true;
        };

        resizeController._setupResizingInfo(-9850);

        resizeController._moveSeparator(getJQueryEvent({
            data: resizeController,
            type: 'mousedown',
            pageX: -9825,
            pageY: 0
        }));

        //assert
        assert.ok(isFreeSpaceRowHeightUpdated);
    });

    QUnit.test("The free space row is not displayed when horizontal scrollbar is shown_B253714", function(assert) {
        if(devices.real().deviceType !== "desktop") {
            assert.ok(true, "height of scrollbar equal zero on mobile device");
            return;
        }

        //arrange
        this.component._controllers.columns = new MockColumnsController([
                { caption: 'Column 1', visible: true, width: '150px' },
                { caption: 'Column 2', visible: true, width: '150px' },
                { caption: 'Column 3', visible: true, width: '150px' },
                { caption: 'Column 4', visible: true, width: '150px' }], this.commonColumnSettings);

        var tablePositionController = new columnResizingReordering.TablePositionViewController(this.component),
            resizeController;

        this.component._controllers.tablePosition = tablePositionController;
        tablePositionController.init();

        resizeController = this.createColumnsResizerViewController();

        resizeController._pointsByColumns = [
            { x: -9875, columnIndex: 0, index: 1 },
            { x: -9750, columnIndex: 1, index: 2 },
            { x: -9625, columnIndex: 2, index: 3 }
        ];

        //act
        this.renderViews($("#container").width(100));

        resizeController._targetPoint = {
            x: -9825,
            columnIndex: 0
        };

        resizeController._isResizing = true;

        resizeController._setupResizingInfo(-9850);

        resizeController._moveSeparator(getJQueryEvent({
            data: resizeController,
            type: 'mousedown',
            pageX: -9909,
            pageY: 0
        }));

        //assert
        assert.equal($(".dx-freespace-row").css("display"), "none", "free row space is not displayed");
    });

    QUnit.test("'Process size changed' method is not called", function(assert) {
        //arrange
        var resizeController,
            isProcessSizeChanged = false,
            tablePositionController = new columnResizingReordering.TablePositionViewController(this.component);

        this.component._controllers.tablePosition = tablePositionController;
        tablePositionController.init();

        resizeController = this.createColumnsResizerViewController();

        resizeController._pointsByColumns = [
            { x: -9875, columnIndex: 0, index: 1 },
            { x: -9750, columnIndex: 1, index: 2 },
            { x: -9625, columnIndex: 2, index: 3 }
        ];

        //act
        this.renderViews($("#container"));

        resizeController._targetPoint = {
            x: -9825,
            columnIndex: 0
        };

        resizeController._isResizing = true;

        this.component._views.columnHeadersView.processSizeChanged = function() {
            isProcessSizeChanged = true;
        };

        this.component._views.rowsView.resize();

        //assert
        assert.ok(!isProcessSizeChanged);
    });

    function hasSubscribesToCallbacks(resizeController) {
        var checkCounter = 0,
            i,
            subscribe;

        for(i = 0; i < resizeController._subscribesToCallbacks.length; i++) {
            subscribe = resizeController._subscribesToCallbacks[i];
            if(subscribe.callback.has(subscribe.handler)) {
                checkCounter++;
            }
        }
        return checkCounter === resizeController._subscribesToCallbacks.length;
    }

    QUnit.test("Init and subscribe to events when allowColumnResizing is changed to true", function(assert) {
        //arrange
        this.commonColumnSettings.allowResizing = false;
        var resizeController = this.createColumnsResizerViewController();

        sinon.stub(resizeController, "_subscribeToEvents");

        //act
        resizeController.optionChanged({
            name: "allowColumnResizing",
            value: true
        });

        //assert
        assert.equal(resizeController._subscribesToCallbacks.length, 5, "subscribes to callbacks count");
        assert.ok(hasSubscribesToCallbacks(resizeController), "subscribes to callbacks");
        assert.ok(resizeController._columnsSeparatorView, "columnsSeparatorView is initialized");
        assert.ok(resizeController._columnHeadersView, "columnHeadersView is initialized");
        assert.ok(resizeController._trackerView, "trackerView is initialized");
        assert.ok(resizeController._rowsView, "rowsView is initialized");
        assert.ok(resizeController._columnsController, "columnsController is initialized");
        assert.ok(resizeController._tablePositionController, "tablePositionController is initialized");
        assert.equal(resizeController._subscribeToEvents.callCount, 1, "subscribeToEvents");
    });

    QUnit.test("Unsubscribe from events and callbacks when allowColumnResizing is changed to false", function(assert) {
        //arrange
        this.commonColumnSettings.allowResizing = true;
        var resizeController = this.createColumnsResizerViewController();

        sinon.stub(resizeController, "_subscribeToEvents");
        sinon.stub(resizeController, "_unsubscribeFromEvents");

        //act
        resizeController.optionChanged({
            name: "allowColumnResizing",
            value: false
        });

        //assert
        assert.equal(resizeController._subscribesToCallbacks.length, 0, "subscribes to callbacks count");
        assert.equal(resizeController._unsubscribeFromEvents.callCount, 1, "unsubscribeFromEvents");
    });

    QUnit.test('TrackerView. Initialize - allowResizing true', function(assert) {
        //arrange
        var controller = this.createColumnsResizerViewController([
            { caption: 'Column 1' },
            { caption: 'Column 2', width: '125px' },
            { caption: 'Column 3', width: '125px' }
        ]);

        //act
        this.renderViews($("#container"));

        //assert
        assert.ok(controller._trackerView);
    });

    QUnit.test('TrackerView. No initialize - allowResizing false', function(assert) {
        //arrange
        this.commonColumnSettings.allowResizing = false;
        var controller = this.createColumnsResizerViewController([
            { caption: 'Column 1' },
            { caption: 'Column 2', width: '125px' },
            { caption: 'Column 3', width: '125px' }
        ]);

        //act
        this.renderViews($("#container"));

        //assert
        assert.ok(!controller._trackerView);
    });

    QUnit.test('TrackerView. Show', function(assert) {
        //arrange
        this.component._views.trackerView = new columnResizingReordering.TrackerView(this.component);
        var controller = this.createColumnsResizerViewController([
            { caption: 'Column 1' },
            { caption: 'Column 2', width: '125px' },
            { caption: 'Column 3', width: '125px' }
            ]),
            testElement = $("#container");

        //act
        this.renderViews(testElement);
        controller._isReadyResizing = true;
        controller._targetPoint = { x: -9750, columnIndex: 1, index: 2 };
        controller._startResizing(getJQueryEvent({
            data: controller,
            type: 'mousedown',
            pageX: -9750,
            target: $('.dx-columns-separator')
        }));

        //assert
        assert.ok(controller._trackerView);
        assert.ok(testElement.find(".dx-datagrid-tracker").length);
        assert.ok(testElement.find(".dx-datagrid-tracker").is(':visible'));
    });

    QUnit.test('TrackerView. Hide', function(assert) {
        //arrange
        var controller = this.createColumnsResizerViewController([
                { caption: 'Column 1' },
                { caption: 'Column 2', width: '125px' },
                { caption: 'Column 3', width: '125px' }
            ]),
            testElement = $("#container");

        //act
        this.renderViews(testElement);

        //act
        controller._isReadyResizing = true;
        controller._targetPoint = { x: -9750, columnIndex: 1, index: 2 };
        controller._startResizing(getJQueryEvent({
            data: controller,
            type: 'mousedown',
            pageX: -9750
        }));

        controller._endResizing(getJQueryEvent({
            data: controller,
            type: 'mouseup'
        }));

        //assert
        assert.ok(!testElement.find(".dx-datagrid-tracker").is(':visible'));
    });

    QUnit.test('TrackerView. Set height', function(assert) {
        //arrange
        this.component._controllers.tablePosition = new columnResizingReordering.TablePositionViewController(this.component);
        this.component._views.trackerView = new columnResizingReordering.TrackerView(this.component);

        var controller = this.createColumnsResizerViewController([
            { caption: 'Column 1' },
            { caption: 'Column 2', width: '125px' },
            { caption: 'Column 3', width: '125px' }
            ]),
            resultHeight,
            testElement = $("#container").height(102);

        //act
        this.component._controllers.tablePosition.init();
        this.renderViews(testElement);

        controller._isReadyResizing = true;
        controller._targetPoint = { x: -9750, columnIndex: 1, index: 2 };
        controller._startResizing(getJQueryEvent({
            data: controller,
            type: 'mousedown',
            pageX: -9750
        }));

        controller._tablePositionController.update();

        resultHeight = controller._columnHeadersView.getHeight() + controller._rowsView.height();

        //assert
        assert.ok(controller._trackerView);
        assert.roughEqual(testElement.find(".dx-datagrid-tracker").height(), resultHeight, 0.1);
    });

    QUnit.test("TrackerView. Position and height are not changed when tracker ccs class is not applied", function(assert) {
        //arrange
        this.commonColumnSettings.allowResizing = false;
        this.component._views.trackerView = new columnResizingReordering.TrackerView(this.component);

        this.createColumnsResizerViewController([
            { caption: 'Column 1' },
            { caption: 'Column 2', width: '125px' },
            { caption: 'Column 3', width: '125px' }
        ]);

        var $tracker;

        //act
        this.renderViews($("#container"));
        this.component._controllers.tablePosition.positionChanged.fire({ top: 23, height: 345 });
        $tracker = this.component._views.trackerView.element();

        //assert
        assert.equal($tracker.css("top"), "auto", "top");
        assert.equal($tracker.height(), 0, "height");
    });

    QUnit.test("TrackerView. It is visible when alloColumnResizing is true and empty columns options", function(assert) {
        //arrange
        this.options.allowColumnResizing = true;
        this.commonColumnSettings.allowResizing = false;
        this.component._views.trackerView = new columnResizingReordering.TrackerView(this.component);

        this.createColumnsResizerViewController();

        //act
        this.renderViews($("#container"));

        //assert
        assert.ok($(".dx-datagrid-tracker").length > 0);
    });

    QUnit.test("TrackerView. Invalidate is called and subscribe to positionChanged when allowColumnResizing is changed to true", function(assert) {
        //arrange
        this.commonColumnSettings.allowResizing = false;
        var trackerView = this.component._views.trackerView = new columnResizingReordering.TrackerView(this.component);
        trackerView.init();
        trackerView.render($("#container"));
        sinon.spy(trackerView, "_invalidate");

        //act
        trackerView.optionChanged({
            name: "allowColumnResizing",
            value: true
        });

        //assert
        assert.ok(trackerView._invalidate.called, "invalidate is called");
        assert.deepEqual(trackerView._invalidate.args[0], [], "_invalidate args");
        assert.ok(trackerView._tablePositionController.positionChanged.has(trackerView._positionChanged), "trackerView is subscribe to positionChanged");
    });

    QUnit.test("TrackerView. Unsubscribe from positionChanged when allowColumnResizing is changed to false", function(assert) {
        //arrange
        this.commonColumnSettings.allowResizing = true;
        var trackerView = this.component._views.trackerView = new columnResizingReordering.TrackerView(this.component);
        trackerView.init();
        trackerView.render($("#container"));

        //act
        trackerView.optionChanged({
            name: "allowColumnResizing",
            value: false
        });

        //assert
        assert.ok(!trackerView._tablePositionController.positionChanged.has(trackerView._positionChanged), "trackerView is unsubscribe from positionChanged");
    });

    //B239204
    QUnit.test('Reset value cursor when not visible separator_B239204', function(assert) {
        //arrange
        this.component._views.columnsSeparatorView = new MockColumnsSeparatorView($("#container"), true, { top: -10000, left: 0 });
        var resizeController = this.createColumnsResizerViewController();

        this.renderViews($("#container"));

        resizeController._pointsByColumns = [
            { x: -9875, columnIndex: 0, index: 1, y: -9995 },
            { x: -9750, columnIndex: 1, index: 2, y: -9995 },
            { x: -9625, columnIndex: 2, index: 3, y: -9995 }
        ];

        //act
        resizeController._columnsSeparatorView.height(100);
        resizeController._moveSeparator(getJQueryEvent({
            data: resizeController,
            type: 'mousedown',
            pageX: -9750,
            pageY: -9995
        }));

        //assert
        assert.equal(resizeController._columnsSeparatorView.cursorName, 'col-resize');

        //act
        resizeController._moveSeparator(getJQueryEvent({
            data: resizeController,
            type: 'mousedown',
            pageX: -9700,
            pageY: -9995
        }));

        //assert
        assert.equal(resizeController._columnsSeparatorView.cursorName, "");
    });
}());

///Headers reordering///
(function() {
    QUnit.module('Headers reordering', {
        beforeEach: function() {
            var that = this;

            that.commonColumnSettings = {
                allowReordering: true,
                allowGrouping: true
            };

            that.options = {
                showColumnHeaders: true,
                commonColumnSettings: that.commonColumnSettings,
                groupPanel: { visible: false }
            };

            $('#container').css({ height: '500px' });

            that.draggingPanels = [new MockDraggingPanel({
                $element: $('<div/>'),
                columnElements: $("#itemsContainer").children(),
                columns: [{ allowReordering: true }, { allowReordering: true }],
                offset: {
                    left: -10000,
                    top: 40,
                    bottom: 70
                },
                location: 'headers'
            }), new MockDraggingPanel({
                $element: $('<div/>'),
                columnElements: $("#itemsContainer").children(),
                columns: [{ allowReordering: true }, { allowReordering: true }],
                offset: {
                    left: -10000,
                    top: 0,
                    bottom: 30
                },
                location: 'group'
            })];

            that.component = {
                NAME: "dxDataGrid",

                element: function() {
                    return $("#container");
                },

                _suppressDeprecatedWarnings: noop,

                _resumeDeprecatedWarnings: noop,

                _controllers: {
                    data: new MockDataController({
                        rows: [{ values: ['', ''] }]
                    }),

                    tablePosition: new MockTablePositionViewController()
                },

                setAria: function(name, value, $target) {
                    var setAttribute = function(option) {
                        var attrName = ($.inArray(option.name, ["role", "id"]) + 1) ? option.name : "aria-" + option.name,
                            attrValue = option.value;

                        if(attrValue === null || attrValue === undefined) {
                            attrValue = undefined;
                        } else {
                            attrValue = attrValue.toString();
                        }

                        domUtils.toggleAttr(option.target, attrName, attrValue);
                    };

                    if(!$.isPlainObject(arguments[0])) {
                        setAttribute({
                            name: arguments[0],
                            value: arguments[1],
                            target: arguments[2] || this._getAriaTarget()
                        });
                    } else {
                        $target = arguments[1] || this._getAriaTarget();

                        $.each(arguments[0], function(key, value) {
                            setAttribute({
                                name: key,
                                value: value,
                                target: $target
                            });
                        });
                    }
                },

                option: function(value) {
                    return that.options[value];
                },

                _createAction: function(handler) {
                    return handler;
                },

                _createActionByOption: function() {
                    return function() { };
                }
            };

            that.component._views = {
                columnsSeparatorView: new columnResizingReordering.ColumnsSeparatorView(that.component),
                draggingHeaderView: new columnResizingReordering.DraggingHeaderView(that.component),
                columnHeadersView: new ColumnHeadersView(that.component),
                headerPanel: new (HeaderPanel.inherit(GroupingHeaderPanelExtender))(that.component),
                columnChooserView: new ColumnChooserView(that.component)
            };

            that.createDraggingHeaderViewController = function(columns) {
                that.component._controllers.columns = new MockColumnsController(columns, that.commonColumnSettings);
                var controller = new columnResizingReordering.DraggingHeaderViewController(that.component);

                controller.init();

                that.component._controllers.draggingHeader = controller;

                that.initViews();

                return controller;
            };

            that.initViews = function() {
                $.each(that.component._views, function(key, value) {
                    value.init();
                });
            };

            that.renderViews = function($container) {
                $.each(that.component._views, function(key, value) {
                    value.render($container);
                });
            };
        },
        afterEach: function() {
            $(".dx-datagrid-drag-header").remove();
        }
    });

    QUnit.test('Get points by columns', function(assert) {
        //arrange
        var controller = this.createDraggingHeaderViewController([{ caption: 'Column 1', width: 500 }, { caption: 'Column 2', width: 500 }]);

        //act
        this.renderViews($("#container"));

        //assert
        assert.deepEqual(gridCore.getPointsByColumns(controller._columnHeadersView._getTableElement().find('td')),
                [{ x: -10000, y: -10000, columnIndex: 0, index: 0 }, { x: -9500, y: -10000, columnIndex: 1, index: 1 }, { x: -9000, y: -10000, columnIndex: 2, index: 2 }], 'dragging points');
    });

    QUnit.test('Get points by columns with startColumnIndex', function(assert) {
        //arrange
        var controller = this.createDraggingHeaderViewController([{ caption: 'Column 1', width: 500 }, { caption: 'Column 2', width: 500 }]);

        //act
        this.renderViews($("#container"));

        //assert
        assert.deepEqual(gridCore.getPointsByColumns(controller._columnHeadersView._getTableElement().find('td'), null, null, 5),
                [{ x: -10000, y: -10000, columnIndex: 5, index: 5 }, { x: -9500, y: -10000, columnIndex: 6, index: 6 }, { x: -9000, y: -10000, columnIndex: 7, index: 7 }], 'dragging points');
    });

    QUnit.test('Get points by columns RTL', function(assert) {
        //arrange
        var controller = this.createDraggingHeaderViewController([{ caption: 'Column 1', width: 500 }, { caption: 'Column 2', width: 500 }]);

        //act
        this.renderViews($("#container"));

        $("#container").css('direction', 'rtl');

        //assert
        assert.deepEqual(gridCore.getPointsByColumns(controller._columnHeadersView._getTableElement().find('td')),
                [{ x: -9000, y: -10000, columnIndex: 0, index: 0 }, { x: -9500, y: -10000, columnIndex: 1, index: 1 }, { x: -10000, y: -10000, columnIndex: 2, index: 2 }], 'dragging points for RTL');
    });

    QUnit.test('Get points by columns with checkbox cell', function(assert) {
        //arrange
        var testColumns = [
            { caption: 'Column 1', allowReordering: false, allowGrouping: false, width: 70 },
            { caption: 'Column 2', width: '125px' },
            { caption: 'Column 3', width: '125px' }
            ],
            controller = this.createDraggingHeaderViewController(testColumns),
            $cells;

        //act
        this.renderViews($("#container").css("width", "320px"));

        //assert
        $cells = controller._columnHeadersView._tableElement.find('td');
        assert.deepEqual(gridCore.getPointsByColumns($cells, function(point) {
            return controller._pointCreated(point, testColumns, "headers", testColumns[1]);
        }), [
            { x: -9930, y: -10000, columnIndex: 1, index: 1 },
            { x: -9805, y: -10000, columnIndex: 2, index: 2 },
            { x: -9680, y: -10000, columnIndex: 3, index: 3 }
        ], 'dragging column index 1');
    });

    QUnit.test('Get points by columns when allowReordering false, allowGrouping true', function(assert) {
        //arrange
        var testColumns = [
            { caption: 'Column 1', allowReordering: false, allowGrouping: true, width: 125 },
            { caption: 'Column 2', allowReordering: false, allowGrouping: true, width: 125 }
            ],
            controller = this.createDraggingHeaderViewController(testColumns),
            $cells;

        //act
        this.renderViews($("#container").width(250));

        $cells = controller._columnHeadersView._tableElement.find('td');

        //assert
        assert.deepEqual(gridCore.getPointsByColumns($cells, function(point) {
            return controller._pointCreated(point, testColumns);
        }), [
            { x: -10000, y: -10000, columnIndex: 0, index: 0 },
            { x: -9875, y: -10000, columnIndex: 1, index: 1 },
            { x: -9750, y: -10000, columnIndex: 2, index: 2 }
        ], 'points by columns');
    });

    QUnit.test('Not get points by columns when allowReordering false, allowGrouping true and location is headers', function(assert) {
        //arrange
        var testColumns = [
            { caption: 'Column 1', allowReordering: false, allowGrouping: true, width: 125 },
            { caption: 'Column 2', allowReordering: false, allowGrouping: true, width: 125 }
            ],
            controller = this.createDraggingHeaderViewController(testColumns),
            $cells;

        //act
        this.renderViews($("#container").width(250));

        $cells = controller._columnHeadersView._tableElement.find('td');

        //assert
        assert.ok(!gridCore.getPointsByColumns($cells, function(point) {
            return controller._pointCreated(point, testColumns, 'headers', testColumns[0]);
        }).length, 'points by columns');
    });

    QUnit.test('Init dragging header when allowReordering is defined and allowGrouping is defined', function(assert) {
        //arrange
        var testElement = $("#container"),
            controller = this.createDraggingHeaderViewController([
            { caption: 'Column 1' },
            { caption: 'Column 2', width: '125px' },
            { caption: 'Column 3', width: '125px' }
            ]),
            $draggingHeader;

        //assert
        assert.ok(controller._draggingHeaderView, 'draggingHeader is not initialized');

        //act
        this.renderViews(testElement);
        $draggingHeader = testElement.find(".dx-datagrid-drag-header");

        //assert
        assert.ok($draggingHeader.length === 1, 'draggingHeader element');
        assert.ok($draggingHeader.css('display'), 'none', 'display is none');
        assert.ok($draggingHeader.hasClass("dx-widget"), "Widget class");
    });

    QUnit.test('Init dragging header when allowReordering false and allowGrouping true', function(assert) {
        //arrange
        this.commonColumnSettings.allowReordering = false;
        var controller = this.createDraggingHeaderViewController([
                    { caption: 'Column 1' },
                    { caption: 'Column 2', width: '125px' },
                    { caption: 'Column 3', width: '125px' }
            ]),
            testElement = $('#container'),
            $draggingHeader;

        //assert
        assert.ok(controller._draggingHeaderView, 'draggingHeader is not initialized');

        //act
        this.renderViews(testElement);
        $draggingHeader = testElement.find(".dx-datagrid-drag-header");

        //assert
        assert.ok($draggingHeader.length === 1, 'draggingHeader element');
        assert.ok($draggingHeader.css('display'), 'none', 'display is none');
    });

    QUnit.test('Init dragging header when allowReordering true and allowGrouping false', function(assert) {
        //arrange
        this.commonColumnSettings.allowGrouping = false;
        var controller = this.createDraggingHeaderViewController([
                    { caption: 'Column 1' },
                    { caption: 'Column 2', width: '125px' },
                    { caption: 'Column 3', width: '125px' }
            ]),
            testElement = $('#container'),
            $draggingHeader;

        //assert
        assert.ok(controller._draggingHeaderView, 'draggingHeader is not initialized');

        //act
        this.renderViews(testElement);
        $draggingHeader = testElement.find(".dx-datagrid-drag-header");

        //assert
        assert.ok($draggingHeader.length === 1, 'draggingHeader element');
        assert.ok($draggingHeader.css('display'), 'none', 'display is none');
    });

    //T112084
    QUnit.test('Init dragging header when allowReordering true and has one column', function(assert) {
        //arrange
        this.options.allowColumnReordering = true;

        this.createDraggingHeaderViewController([
                    { caption: 'Column 1' }
        ]);

        var testElement = $('#container'),
            td;

        //act
        this.renderViews(testElement);

        td = testElement.find(".dx-datagrid-headers").first().find("td").first();

        //assert
        assert.ok(!$._data(td[0], "events"), "no dxpointerdown event subscription");
    });

    //B254473
    QUnit.test('Drag header with nowrap', function(assert) {
        //arrange
        var testElement = $('#container'),
            draggingHeader,
            $dragHeader;

        //act
        this.createDraggingHeaderViewController();
        draggingHeader = new TestDraggingHeader(this.component);
        draggingHeader.render(testElement);
        draggingHeader.dragHeader({
            columnElement: $('<td />', {
                css: {
                    textAlign: 'right',
                    whiteSpace: 'nowrap',
                    width: '100px',
                    height: '50px'
                }
            }),
            sourceColumn: {
                caption: "TestDrag"
            }
        });
        $dragHeader = $(".dx-datagrid-drag-header");

        //assert
        assert.ok(draggingHeader._isDragging, 'is dragging');
        assert.equal($dragHeader.css('text-align'), 'right', 'text-align');
        assert.equal($dragHeader.css('white-space'), 'nowrap', 'white-space');
        assert.roughEqual($dragHeader.height(), 50, 0.1, 'height');
        assert.equal($dragHeader.width(), 100, 'width');
        assert.equal($dragHeader.text(), 'TestDrag', 'text');
    });

    //B254473
    QUnit.test('Drag header without nowrap', function(assert) {
        //arrange
        var testElement = $('#container'),
            draggingHeader,
            $dragHeader;

        //act
        this.createDraggingHeaderViewController();
        draggingHeader = new TestDraggingHeader(this.component);
        draggingHeader.render(testElement);
        draggingHeader.dragHeader({
            columnElement: $('<td />', {
                css: {
                    textAlign: 'left',
                    width: '100px',
                    height: '50px'
                }
            }),
            sourceColumn: {
                caption: "TestDrag"
            }
        });

        $dragHeader = $(".dx-datagrid-drag-header");

        //assert
        assert.ok(draggingHeader._isDragging, 'is dragging');
        assert.equal($dragHeader.css('text-align'), 'left', 'text-align');
        assert.equal($dragHeader.css('white-space'), 'normal', 'white-space');
        assert.equal($dragHeader.height(), 50, 'height');
        assert.equal($dragHeader.width(), 100, 'width');
        assert.equal($dragHeader.text(), 'TestDrag', 'text');
    });

    QUnit.test('Dock header to points', function(assert) {
        //arrange
        var testElement = $('#container'),
            options,
            draggingHeader,
            $draggingHeader,
            controller = this.createDraggingHeaderViewController();

        //act
        controller.dock = function(params) {
            options = params;
        };
        draggingHeader = new TestDraggingHeader(this.component);
        draggingHeader.init();
        draggingHeader.render(testElement);

        draggingHeader.dragHeader({
            columnElement: $('<td />'),
            sourceLocation: 'headers',
            draggingPanels: this.draggingPanels,
            deltaX: 2,
            deltaY: 1,
            sourceColumn: {
                caption: "TestDrag",
                allowReordering: true
            }
        });

        //act
        draggingHeader.moveHeader({
            jQueryEvent: {
                data: {
                    that: draggingHeader,
                    rootElement: testElement
                },
                preventDefault: function() { },
                pageX: -9900,
                pageY: 55,
                type: 'mouse'
            }
        });
        $draggingHeader = $(".dx-datagrid-drag-header");

        //assert
        assert.equal(options.posX, -9875, 'dockedPosX');
        assert.equal($draggingHeader.offset().left, -9902, 'draggingHeader offset left');
        assert.equal(Math.ceil($draggingHeader.offset().top), 54, 'draggingHeader offset top');
        assert.ok($draggingHeader.css('display', ''), 'header is displayed');
    });

    QUnit.test("Check dragging header visibility after loading", function(assert) {
        //arrange
        var testElement = $("#container"),
            options,
            draggingHeader,
            $draggingHeader,
            controller = this.createDraggingHeaderViewController();

        controller.dock = function(params) {
            options = params;
        };
        draggingHeader = new TestDraggingHeader(this.component);
        draggingHeader.init();
        draggingHeader.render(testElement);

        draggingHeader.dragHeader({
            columnElement: $("<td />"),
            sourceLocation: "headers",
            draggingPanels: this.draggingPanels,
            deltaX: 2,
            deltaY: 1,
            sourceColumn: {
                caption: "TestDrag",
                allowReordering: true
            }
        });

        draggingHeader.moveHeader({
            jQueryEvent: {
                data: {
                    that: draggingHeader,
                    rootElement: testElement
                },
                preventDefault: function() { },
                pageX: -9900,
                pageY: 55,
                type: "mouse"
            }
        });

        $draggingHeader = $(".dx-datagrid-drag-header");

        //act
        assert.notEqual($draggingHeader.css("display"), "none", "header is visible");

        this.component._controllers.data.loadingChanged.fire(false, "loading finished");

        //assert
        assert.equal($draggingHeader.css("display"), "none", "header is hidden");
    });

    QUnit.test('Dock header to points RTL', function(assert) {
        //arrange
        var testElement = $('#container'),
            options,
            draggingHeader,
            $draggingHeader,
            controller = this.createDraggingHeaderViewController();

        testElement.css('direction', 'rtl');
        $("#itemsContainer").css('direction', 'rtl');
        this.options.rtlEnabled = true;

        //act
        controller.dock = function(params) {
            options = params;
        };
        draggingHeader = new TestDraggingHeader(this.component);
        draggingHeader.init();
        draggingHeader.render(testElement);

        draggingHeader.dragHeader({
            columnElement: $('<td />'),
            sourceLocation: 'headers',
            draggingPanels: this.draggingPanels,
            deltaX: 2,
            deltaY: 1,
            sourceColumn: {
                caption: "TestDrag",
                allowReordering: true
            }
        });

        //act

        draggingHeader.moveHeader({
            jQueryEvent: {
                data: {
                    that: draggingHeader,
                    rootElement: testElement
                },
                preventDefault: function() { },
                pageX: -9900,
                pageY: 55,
                type: 'mouse'
            }
        });

        $draggingHeader = $(".dx-datagrid-drag-header");

        //assert
        assert.equal(options.posX, -9250, 'dockedPosX');
        assert.equal($draggingHeader.offset().left, -9902, 'draggingHeader offset left');
        assert.equal(Math.ceil($draggingHeader.offset().top), 54, 'draggingHeader offset top');
        assert.ok($draggingHeader.css('display', ''), 'header is displayed');
    });

    QUnit.test('Drop header', function(assert) {
        //arrange
        var testElement = $('#container'),
            dropParameters,
            draggingHeader,
            $draggingHeader,
            controller = this.createDraggingHeaderViewController();

        //act
        controller.drop = function(parameters) {
            dropParameters = parameters;
        };

        controller.allowDrop = function(parameters) {
            if(parameters.targetLocation === parameters.sourceLocation && parameters.targetColumnIndex === parameters.sourceColumnIndex) {
                return false;
            }
            return true;
        };

        controller._rowsView = {};
        controller._rowsView.setRowsOpacity = function() { };
        controller._columnHeadersView.element = function() { return $('<div />'); };

        draggingHeader = new TestDraggingHeader(this.component);
        draggingHeader.init();

        this.component._views.columnsSeparatorView.render(testElement);
        draggingHeader.render(testElement);

        draggingHeader.dragHeader({
            sourceLocation: 'headers',
            draggingPanels: this.draggingPanels,
            deltaX: 2,
            deltaY: 1,
            columnIndex: 0,
            columnElement: $('<td />'),
            sourceColumn: {
                caption: "TestDrag",
                allowReordering: true
            }
        });

        draggingHeader.moveHeader({
            jQueryEvent: {
                data: {
                    that: draggingHeader,
                    rootElement: testElement
                },
                preventDefault: function() { },
                pageX: -9900,
                pageY: 55,
                type: 'mouse'
            }
        });

        draggingHeader.dropHeader({ jQueryEvent: { data: { that: draggingHeader } } });

        $draggingHeader = $(".dx-datagrid-drag-header");

        //assert
        assert.equal(dropParameters.sourceColumnIndex, 0, 'sourceColumnIndex');
        assert.equal(dropParameters.sourceLocation, 'headers', 'sourceLocation');
        assert.equal(dropParameters.sourceColumnElement.css('opacity'), 0.5, 'sourceColumnElement');
        assert.equal(dropParameters.targetColumnIndex, 1, 'targetColumnIndex');
        assert.equal(dropParameters.targetLocation, 'headers', 'targetLocation');
        assert.ok(!draggingHeader._isDragging, 'is not dragged');
        assert.ok(!$draggingHeader.is(':visible'), 'header is not displayed');
    });

    QUnit.test('Drop header RTL', function(assert) {
        //arrange
        var testElement = $('#container'),
            dropParameters,
            draggingHeader,
            $draggingHeader,
            controller = this.createDraggingHeaderViewController();

        testElement.css('direction', 'rtl');
        $("#itemsContainer").css('direction', 'rtl');
        this.options.rtlEnabled = true;

        //act
        controller.drop = function(parameters) {
            dropParameters = parameters;
        };

        controller.allowDrop = function(parameters) {
            if(parameters.targetLocation === parameters.sourceLocation && parameters.targetColumnIndex === parameters.sourceColumnIndex) {
                return false;
            }
            return true;
        };

        controller._rowsView = {};
        controller._rowsView.setRowsOpacity = function() { };
        controller._columnHeadersView.element = function() { return $('<div />'); };

        draggingHeader = new TestDraggingHeader(this.component);
        draggingHeader.init();

        this.component._views.columnsSeparatorView.render(testElement);
        draggingHeader.render(testElement);

        draggingHeader.dragHeader({
            sourceLocation: 'headers',
            draggingPanels: this.draggingPanels,
            deltaX: 2,
            deltaY: 1,
            columnIndex: 0,
            columnElement: $('<td />'),
            sourceColumn: {
                caption: "TestDrag",
                allowReordering: true
            }
        });

        draggingHeader.moveHeader({
            jQueryEvent: {
                data: {
                    that: draggingHeader,
                    rootElement: testElement
                },
                preventDefault: function() { },
                pageX: -9900,
                pageY: 55,
                type: 'mouse'
            }
        });

        draggingHeader.dropHeader({
            jQueryEvent: {
                data: { that: draggingHeader }
            }
        });

        $draggingHeader = $(".dx-datagrid-drag-header");

        //assert
        assert.equal(dropParameters.sourceColumnIndex, 0, 'sourceColumnIndex');
        assert.equal(dropParameters.sourceLocation, 'headers', 'sourceLocation');
        assert.equal(dropParameters.sourceColumnElement.css('opacity'), 0.5, 'sourceColumnElement');
        assert.equal(dropParameters.targetColumnIndex, 2, 'targetColumnIndex');
        assert.equal(dropParameters.targetLocation, 'headers', 'targetLocation');
        assert.ok(!draggingHeader._isDragging, 'is not dragged');
        assert.ok(!$draggingHeader.is(':visible'), 'header is not displayed');
    });

    QUnit.test('Drop header to source order', function(assert) {
        //arrange
        var testElement = $('#container'),
            dropParameters,
            draggingHeader,
            $draggingHeader,
            controller = this.createDraggingHeaderViewController();

        controller.drop = function(parameters) {
            if(this.allowDrop(parameters)) {
                dropParameters = parameters;
            }
        };
        controller.allowDrop = function(parameters) {
            if(parameters.targetLocation === parameters.sourceLocation && parameters.targetColumnIndex === parameters.sourceColumnIndex) {
                return false;
            }
            return true;
        };

        controller._rowsView = {};
        controller._rowsView.setRowsOpacity = function() { };
        controller._columnHeadersView.element = function() { return $('<div />'); };

        draggingHeader = new TestDraggingHeader(this.component);

        draggingHeader.init();

        this.component._views.columnsSeparatorView.render(testElement);
        draggingHeader.render(testElement);

        draggingHeader.dragHeader({
            columnElement: $('<td />'),
            sourceLocation: 'headers',
            draggingPanels: this.draggingPanels,
            deltaX: 2,
            deltaY: 1,
            columnIndex: 1,
            sourceColumn: {
                caption: "TestDrag",
                allowReordering: true
            }
        });

        draggingHeader.moveHeader({
            jQueryEvent: {
                data: {
                    that: draggingHeader,
                    rootElement: testElement
                },
                preventDefault: function() { },
                pageX: -9900,
                pageY: 55,
                type: 'mouse'
            }
        });

        //act
        draggingHeader.dropHeader({
            jQueryEvent: {
                data: { that: draggingHeader }
            }
        });

        $draggingHeader = $(".dx-datagrid-drag-header");

        //assert
        assert.ok(!dropParameters, 'drop parameters');
        assert.ok(!draggingHeader._isDragging, 'is not dragged');
        assert.ok(!$draggingHeader.is(':visible'), 'header is not displayed');
    });

    QUnit.test('Move drag header for left side of root container', function(assert) {
        //arrange
        var testElement = $('#container'),
            controller = this.createDraggingHeaderViewController(),
            offsetParameters,
            draggingHeader = new TestDraggingHeader(this.component);

        controller._rowsView = {};
        controller._rowsView.setRowsOpacity = function() { };
        controller._columnHeadersView.element = function() { return $('<div />'); };

        draggingHeader.init();

        this.component._views.columnsSeparatorView.render(testElement);
        draggingHeader.render(testElement);

        draggingHeader.element().offset = function(parameters) {
            offsetParameters = parameters;
        };

        draggingHeader.dragHeader({
            columnElement: $('<td/>'),
            sourceLocation: 'headers',
            draggingPanels: this.draggingPanels,
            columnIndex: 0,
            deltaX: 2,
            deltaY: 1,
            sourceColumn: {
                caption: "TestDrag",
                allowReordering: true
            }
        });

        //act
        draggingHeader.moveHeader({
            jQueryEvent: {
                data: {
                    that: draggingHeader,
                    rootElement: testElement
                },
                preventDefault: function() { },
                pageX: -10005,
                pageY: 55,
                type: 'mouse'
            }
        });

        //assert
        assert.deepEqual(offsetParameters, { left: -10007, top: 54 }, 'offset parameters');
    });

    QUnit.test('Move drag header for right side of root container', function(assert) {
        //arrange
        var testElement = $('#container'),
            offsetParameters,
            controller = this.createDraggingHeaderViewController(),
            draggingHeader = new TestDraggingHeader(this.component);

        controller._rowsView = {};
        controller._rowsView.setRowsOpacity = function() { };
        controller._columnHeadersView.element = function() { return $('<div />'); };

        draggingHeader.init();

        this.component._views.columnsSeparatorView.render(testElement);
        draggingHeader.render(testElement);

        draggingHeader.element().offset = function(parameters) {
            offsetParameters = parameters;
        };

        draggingHeader.dragHeader({
            columnElement: $('<td />'),
            sourceLocation: 'headers',
            draggingPanels: this.draggingPanels,
            columnIndex: 0,
            deltaX: 2,
            deltaY: 1,
            sourceColumn: {
                caption: "TestDrag",
                allowReordering: true
            }
        });

        //act
        draggingHeader.moveHeader({
            jQueryEvent: {
                data: {
                    that: draggingHeader,
                    rootElement: testElement
                },
                preventDefault: function() { },
                pageX: -9000,
                pageY: 55,
                type: 'mouse'
            }
        });

        //assert
        assert.deepEqual(offsetParameters, { left: -9002, top: 54 }, 'offset parameters');
    });

    //B254315
    QUnit.test('Not show drag header when mouse moved to position less or equals DRAGGING_DELTA', function(assert) {
        //arrange
        var testElement = $('#container'),
            controller = this.createDraggingHeaderViewController(),
            draggingHeader = new TestDraggingHeader(this.component),
            baseOffset = -10000,
            baseDelta = 5,
            columnElement = $('<td/>').appendTo($('#container')).offset({ left: baseOffset, top: baseOffset });

        controller._rowsView = {};
        controller._rowsView.setRowsOpacity = function() { };
        controller._columnHeadersView.element = function() { return $('<div />'); };

        draggingHeader.init();

        this.component._views.columnsSeparatorView.render(testElement);
        draggingHeader.render(testElement);

        draggingHeader.dragHeader({
            columnElement: columnElement,
            sourceLocation: 'headers',
            draggingPanels: this.draggingPanels,
            columnIndex: 0,
            deltaX: baseDelta,
            deltaY: baseDelta,
            sourceColumn: {
                caption: "TestDrag",
                allowReordering: true
            }
        });

        //act
        draggingHeader.moveHeader({
            jQueryEvent: {
                data: {
                    that: draggingHeader,
                    rootElement: testElement
                },
                preventDefault: function() { },
                pageX: baseOffset + baseDelta - 2,
                pageY: baseOffset + baseDelta,
                type: 'mouse'
            }
        });

        //assert
        assert.ok(!draggingHeader.element().is(':visible'));
    });

    //B254315
    QUnit.test('Show drag header when mouse moved to position more DRAGGING_DELTA', function(assert) {
        //arrange
        var testElement = $('#container'),
            controller = this.createDraggingHeaderViewController(),
            draggingHeader = new TestDraggingHeader(this.component),
            baseOffset = -10000,
            baseDelta = 5,
            columnElement = $('<td/>').appendTo($('#container')).offset({ left: baseOffset, top: baseOffset });

        controller._rowsView = {};
        controller._rowsView.setRowsOpacity = function() { };
        controller._columnHeadersView.element = function() { return $('<div />'); };

        draggingHeader.init();

        this.component._views.columnsSeparatorView.render(testElement);
        draggingHeader.render(testElement);

        draggingHeader.dragHeader({
            columnElement: columnElement,
            sourceLocation: 'headers',
            draggingPanels: this.draggingPanels,
            columnIndex: 0,
            deltaX: baseDelta,
            deltaY: baseDelta,
            sourceColumn: {
                caption: "TestDrag",
                allowReordering: true
            }
        });

        //act
        draggingHeader.moveHeader({
            jQueryEvent: {
                data: {
                    that: draggingHeader,
                    rootElement: testElement
                },
                preventDefault: function() { },
                pageX: baseOffset + baseDelta + 6,
                pageY: baseOffset + baseDelta,
                type: 'mouse'
            }
        });

        //assert
        assert.ok(draggingHeader.element().is(':visible'));
    });

    QUnit.test('Move drag header - onselectstart', function(assert) {
        //arrange
        var testElement = $('#container').width(600),
            controller = this.createDraggingHeaderViewController(),
            draggingHeader = new TestDraggingHeader(this.component);

        controller._rowsView = {};
        controller._rowsView.setRowsOpacity = function() { };
        controller._columnHeadersView.element = function() { return $('<div />'); };

        document["onselectstart"] = function() {
            return 'Test';
        };

        //act
        draggingHeader.init();

        this.component._views.columnsSeparatorView.render(testElement);
        draggingHeader.render(testElement);

        draggingHeader.dragHeader({
            columnElement: $('<td/>'),
            sourceLocation: 'headers',
            draggingPanels: this.draggingPanels,
            columnIndex: 0,
            deltaX: 2,
            deltaY: 1,
            isGroupPanel: false,
            sourceColumn: {
                caption: "TestDrag",
                allowReordering: true
            }
        });

        //assert
        assert.ok(draggingHeader._onSelectStart);
        assert.ok(!document["onselectstart"]());

        //act
        draggingHeader.moveHeader({
            jQueryEvent: {
                data: {
                    that: draggingHeader,
                    rootElement: testElement
                },
                preventDefault: function() { },
                pageX: -10005,
                pageY: 55,
                type: 'mouse'
            }
        });

        draggingHeader.dropHeader({
            jQueryEvent: {
                data: {
                    that: draggingHeader,
                    rootElement: testElement
                },
                pageX: -10005,
                pageY: 55,
                type: 'mouse'
            }
        });

        //assert
        assert.equal(document["onselectstart"](), 'Test');
    });

    QUnit.test('Move drag header on the left side column with allowReordering false', function(assert) {
        //arrange
        var testElement = $('#container').width(600),
            dropParameters,
            $draggingHeader,
            controller = this.createDraggingHeaderViewController(),
            draggingHeader = new TestDraggingHeader(this.component);

        $("#itemsContainer").html('<div style="width:125px; display: inline-block;" /><div style="width:125px; display: inline-block;" />');

        controller.drop = function(parameters) {
            if(this.allowDrop(parameters)) {
                dropParameters = parameters;
            }
        };

        controller.allowDrop = function(parameters) {
            if(parameters.targetLocation === parameters.sourceLocation && parameters.targetColumnIndex === parameters.sourceColumnIndex) {
                return false;
            }
            return true;
        };

        controller._rowsView = {};
        controller._rowsView.setRowsOpacity = function() { };
        controller._columnHeadersView.element = function() { return $('<div />'); };

        this.draggingPanels = [new MockDraggingPanel({
            $element: $('<div/>'),
            columnElements: $("#itemsContainer").children(),
            columns: [
                { allowReordering: false },
                { allowReordering: true },
                { allowReordering: true }
            ],
            offset: {
                top: 40,
                bottom: 70
            },
            location: 'headers'
        }), new MockDraggingPanel({
            $element: $('<div/>'),
            columnElements: $("#itemsContainer").children(),
            columns: [
                { allowReordering: true },
                { allowReordering: true }
            ],
            offset: {
                left: -10000,
                top: 0,
                bottom: 30
            },
            location: 'group'
        })];

        draggingHeader.init();

        this.component._views.columnsSeparatorView.render(testElement);
        draggingHeader.render(testElement);

        draggingHeader.dragHeader({
            columnElement: $('<td/>'),
            sourceLocation: 'headers',
            draggingPanels: this.draggingPanels,
            columnIndex: 1,
            deltaX: 2,
            deltaY: 1,
            sourceColumn: {
                caption: "TestDrag",
                allowReordering: true
            }
        });

        //act
        draggingHeader.moveHeader({
            jQueryEvent: {
                data: {
                    that: draggingHeader,
                    rootElement: testElement
                },
                preventDefault: function() { },
                pageX: -10200,
                pageY: 55,
                type: 'mouse'
            }
        });

        draggingHeader.dropHeader({
            jQueryEvent: {
                data: {
                    that: draggingHeader,
                    rootElement: testElement
                },
                pageX: -10200,
                pageY: 55,
                type: 'mouse'
            }
        });

        $draggingHeader = $(".dx-datagrid-drag-header");

        //assert
        assert.ok(!dropParameters, 'drop parameters');
        assert.ok(!draggingHeader._isDragging, 'is not dragged');
        assert.ok(!$draggingHeader.is(':visible'), 'header is not displayed');
    });

    QUnit.test('Move drag header on the right side column with allowReordering false', function(assert) {
        //arrange
        var testElement = $('#container').width(600),
            dropParameters,
            $draggingHeader,
            controller = this.createDraggingHeaderViewController(),
            draggingHeader = new TestDraggingHeader(this.component);

        $("#itemsContainer").html('<div style="width:125px; display: inline-block;" /><div style="width:125px; display: inline-block;" />');

        controller.drop = function(parameters) {
            if(this.allowDrop(parameters)) {
                dropParameters = parameters;
            }
        };

        controller.allowDrop = function(parameters) {
            if(parameters.targetLocation === parameters.sourceLocation && parameters.targetColumnIndex === parameters.sourceColumnIndex) {
                return false;
            }
            return true;
        };

        controller._rowsView = {};
        controller._rowsView.setRowsOpacity = function() { };
        controller._columnHeadersView.element = function() { return $('<div />'); };

        this.draggingPanels = [new MockDraggingPanel({
            $element: $('<div/>'),
            columnElements: $("#itemsContainer").children(),
            columns: [{ allowReordering: true }, { allowReordering: true }, { allowReordering: false }],
            offset: {
                left: -10000,
                top: 40,
                bottom: 70
            },
            location: 'headers'
        }), new MockDraggingPanel({
            $element: $('<div/>'),
            columnElements: $("#itemsContainer").children(),
            columns: [{ allowReordering: true }, { allowReordering: true }],
            offset: {
                left: -10000,
                top: 0,
                bottom: 30
            },
            location: 'group'
        })];

        draggingHeader.init();

        this.component._views.columnsSeparatorView.render(testElement);
        draggingHeader.render(testElement);

        draggingHeader.dragHeader({
            columnElement: $('<td/>'),
            sourceLocation: 'headers',
            draggingPanels: this.draggingPanels,
            columnIndex: 2,
            deltaX: 2,
            deltaY: 1,
            sourceColumn: {
                caption: "TestDrag",
                allowReordering: true
            }
        });

        //act
        draggingHeader.moveHeader({
            jQueryEvent: {
                data: {
                    that: draggingHeader,
                    rootElement: testElement
                },
                preventDefault: function() { },
                pageX: -9400,
                pageY: 55,
                type: 'mouse'
            }
        });

        draggingHeader.dropHeader({
            jQueryEvent: {
                data: {
                    that: draggingHeader,
                    rootElement: testElement
                },
                pageX: -9400,
                pageY: 55,
                type: 'mouse'
            }
        });

        $draggingHeader = $(".dx-datagrid-drag-header");

        //assert
        assert.ok(!dropParameters, 'drop parameters');
        assert.ok(!draggingHeader._isDragging, 'is not dragged');
        assert.ok(!$draggingHeader.is(':visible'), 'header is not displayed');
    });

    //QUnit.test('target column index equals source column index after QUnit.start dragging without moving', function (assert) {
    //    //arrange
    //    var testElement = $('#container'),
    //        dropParameters,
    //        controller = this.createDraggingHeaderViewController(),
    //        draggingHeader = new TestDraggingHeader(this.component);
    //
    //    //act
    //    controller.drop = function (parameters) {
    //        dropParameters = parameters;
    //    };
    //    controller.allowDrop = function (parameters) {
    //        return true;
    //    };
    //
    //    draggingHeader.init();
    //
    //    this.component._views.columnsSeparatorView.render(testElement);
    //    draggingHeader.render(testElement);
    //
    //    draggingHeader.dragHeader({
    //        sourceLocation: 'headers',
    //        draggingPanels: this.draggingPanels,
    //        columnIndex: 1,
    //        deltaX: 2,
    //        deltaY: 1,
    //        sourceColumn: {
    //            caption: "TestDrag",
    //            allowReordering: true
    //        }
    //    });
    //
    //    draggingHeader.dropHeader({
    //        jQueryEvent: {
    //            data: {
    //                that: draggingHeader,
    //                rootElement: testElement
    //            },
    //            pageX: -10000,
    //            pageY: 55,
    //            type: 'mouse'
    //        }
    //    });
    //
    //    //assert
    //    assert.ok(dropParameters);
    //    assert.equal(dropParameters.sourceColumnIndex, 1);
    //    assert.equal(dropParameters.targetColumnIndex, 1);
    //});

    QUnit.test('Rise element events', function(assert) {
        //arrange
        var testElement = $('#container'),
            controller,
            $draggingHeader;

        this.component._views.draggingHeaderView = new TestDraggingHeader2(this.component);
        controller = this.createDraggingHeaderViewController([{ caption: 'Column 1', width: 100 }, { caption: 'Column 2', width: 200 }]);

        //act
        this.renderViews(testElement);

        $draggingHeader = controller._columnHeadersView.element().find("td").first();
        $draggingHeader.trigger(dragEvents.start);
        $draggingHeader.trigger(dragEvents.move);
        $draggingHeader.trigger(dragEvents.end);

        assert.equal(controller._draggingHeaderView.callDragCounter, 1, 'drag start');
        assert.equal(controller._draggingHeaderView.callMoveCounter, 1, 'drag');
        assert.equal(controller._draggingHeaderView.callDropCounter, 1, 'drag end');
    });

    QUnit.test('Reset opacity for rows', function(assert) {
        var testElement = $('#container'),
            draggingHeader,
            columnIndexOpacity,
            opacityValue,
            controller = this.createDraggingHeaderViewController();

        controller._rowsView = {};
        controller._columnHeadersView = { setRowsOpacity: noop };
        controller._rowsView.setRowsOpacity = function(columnIndex, value) {
            columnIndexOpacity = columnIndex;
            opacityValue = value;
        };
        controller._columnHeadersView.element = function() {
            return $('<div/>');
        };

        draggingHeader = new TestDraggingHeader(this.component);

        draggingHeader.init();

        this.component._views.columnsSeparatorView.render(testElement);
        draggingHeader.render(testElement);

        draggingHeader.dragHeader({
            sourceLocation: 'headers',
            draggingPanels: this.draggingPanels,
            deltaX: 2,
            deltaY: 1,
            columnIndex: 1,
            index: 1,
            columnElement: $('<td />'),
            sourceColumn: {
                caption: "TestDrag",
                allowReordering: true
            }
        });

        draggingHeader.moveHeader({
            jQueryEvent: {
                data: {
                    that: draggingHeader,
                    rootElement: testElement
                },
                preventDefault: function() { },
                pageX: -9900,
                pageY: 55,
                type: 'mouse'
            }
        });

        //assert
        assert.equal(columnIndexOpacity, 1);
        assert.equal(opacityValue, 0.5);

        //act
        draggingHeader.dropHeader({
            jQueryEvent: {
                data: { that: draggingHeader }
            }
        });

        //assert
        assert.equal(columnIndexOpacity, 1);
        assert.equal(opacityValue, '');
    });

    //B253154
    QUnit.test('Reorderable when several dataGrid', function(assert) {
        //arrange
        var that = this,
            controller1 = that.createDraggingHeaderViewController([{ caption: 'Column 1', width: 100 }, { caption: 'Column 2', width: 200 }]),
            moveHeaderDataSelfArgs = [];

        controller1._draggingHeaderView.moveHeader = function(args) {
            moveHeaderDataSelfArgs.push(args.jQueryEvent.data.that);
        };

        that.renderViews($("#container"));

        that.component._views = {
            columnsSeparatorView: new columnResizingReordering.ColumnsSeparatorView(that.component),
            draggingHeaderView: new columnResizingReordering.DraggingHeaderView(that.component),
            columnHeadersView: new ColumnHeadersView(that.component),
            headerPanel: new HeaderPanel(that.component),
            columnChooserView: new ColumnChooserView(that.component)
        };

        var controller2 = that.createDraggingHeaderViewController([{ caption: 'Column 3', width: 300 }, { caption: 'Column 4', width: 400 }]);

        controller2._draggingHeaderView.moveHeader = function(args) {
            moveHeaderDataSelfArgs.push(args.jQueryEvent.data.that);
        };

        that.renderViews($("#container2").height(500));

        //act
        controller1._columnHeadersView.element().find("td").first().trigger(dragEvents.move + '.dxDataGridResizingReordering');

        //assert
        assert.equal(moveHeaderDataSelfArgs.length, 1);
        assert.ok(moveHeaderDataSelfArgs[0] === controller1._draggingHeaderView);

        //act
        controller2._columnHeadersView.element().find("td").first().trigger(dragEvents.move + '.dxDataGridResizingReordering');

        //assert
        assert.equal(moveHeaderDataSelfArgs.length, 2);
        assert.ok(moveHeaderDataSelfArgs[0] === controller1._draggingHeaderView);
        assert.ok(moveHeaderDataSelfArgs[1] === controller2._draggingHeaderView);
    });
}());

///Group panel reordering///
(function() {
    QUnit.module("Group panel reordering", {
        beforeEach: function() {
            var that = this;
            that.commonColumnSettings = { allowReordering: true };

            that.options = {
                showColumnHeaders: true,
                commonColumnSettings: that.commonColumnSettings,
                groupPanel: { visible: true }
            };

            $('#container').css({ height: '500px' });

            that.draggingPanels = [new MockDraggingPanel({
                $element: $('<div/>'),
                columnElements: $("#itemsContainer").children(),
                columns: [{ allowReordering: true }, { allowReordering: true }],
                offset: {
                    top: 40
                },
                location: 'headers'
            }),
                new MockDraggingPanel({
                    $element: $('<div/>'),
                    columnElements: $("#itemsContainer").children(),
                    columns: [{ allowReordering: true }, { allowReordering: true }],
                    offset: {
                        top: 0,
                        bottom: 30
                    },
                    location: 'group'
                })];

            setupDataGridModules(this, ['data', 'columns', 'columnHeaders', 'rows', 'headerPanel', 'grouping', 'gridView', 'columnsResizingReordering', 'columnChooser'], {
                initViews: true,
                controllers: {
                    data: new MockDataController({
                        rows: [{ values: ['', ''] }]
                    }),
                    columns: new MockColumnsController([], that.commonColumnSettings),
                    tablePosition: new MockTablePositionViewController()
                },
                views: {
                    draggingHeaderView: new TestDraggingHeader(that)
                }
            });

            that.controller = that.draggingHeaderController;
        },
        afterEach: function() {
            $(".dx-datagrid-drag-header").remove();
        }
    });

    QUnit.test('Dock group panel to points', function(assert) {
        //arrange
        var testElement = $('#container'),
            options,
            $draggingHeaderView;

        this.controller.dock = function(params) {
            options = params;
        };

        this.draggingHeaderView.render(testElement);
        this.draggingHeaderView.dragHeader({
            columnElement: $('<div/>'),
            sourceLocation: 'group',
            draggingPanels: this.draggingPanels,
            deltaX: 2,
            deltaY: 1,
            sourceColumn: {
                caption: "TestDrag",
                allowReordering: true
            }
        });

        //act
        this.draggingHeaderView.moveHeader({
            jQueryEvent: {
                data: {
                    that: this.draggingHeaderView,
                    rootElement: testElement
                },
                preventDefault: function() { },
                pageX: -9900,
                pageY: 5,
                type: 'mouse'
            }
        });
        $draggingHeaderView = $(".dx-datagrid-drag-header");

        //assert
        var headerViewOffset = $draggingHeaderView.offset();

        assert.equal(options.posX, -9875, 'dockedPosX');
        assert.equal(headerViewOffset.left, -9902, 'draggingHeaderView left offset');
        assert.equal(Math.round(headerViewOffset.top), 4, 'draggingHeaderView top offset');
        assert.ok($draggingHeaderView.css('display', ''), 'draggingHeaderView is displayed');
    });

    QUnit.test('Drop group panel', function(assert) {
        //arrange
        var testElement = $('#container'),
            dropParameters,
            $draggingHeaderView;

        this.controller.drop = function(parameters) {
            dropParameters = parameters;
        };
        this.controller.allowDrop = function(parameters) {
            if(parameters.targetLocation === parameters.sourceLocation && parameters.targetColumnIndex === parameters.sourceColumnIndex) {
                return false;
            }
            return true;
        };
        this.controller._rowsView = {};
        this.controller._rowsView.setRowsOpacity = function() { };

        this.controller._columnHeadersView.element = function() { return $('<div />'); };

        this.draggingHeaderView.render(testElement);
        this.blockSeparatorView.render(testElement);

        this.draggingHeaderView.dragHeader({
            sourceLocation: 'group',
            draggingPanels: this.draggingPanels,
            deltaX: 2,
            deltaY: 1,
            columnIndex: 0,
            columnElement: $('<div />'),
            sourceColumn: {
                caption: "TestDrag",
                allowReordering: true
            }
        });

        //act
        this.draggingHeaderView.moveHeader({
            jQueryEvent: {
                data: {
                    that: this.draggingHeaderView,
                    rootElement: testElement
                },
                preventDefault: function() { },
                pageX: -9900,
                pageY: 5,
                type: 'mouse'
            }
        });

        this.draggingHeaderView.dropHeader({
            jQueryEvent: {
                data: {
                    that: this.draggingHeaderView
                },
                pageX: -9900,
                pageY: 5,
                type: 'mouse'
            }
        });

        $draggingHeaderView = $(".dx-datagrid-drag-header");

        //assert
        assert.equal(dropParameters.sourceColumnIndex, 0, 'sourceColumnIndex');
        assert.equal(dropParameters.sourceLocation, 'group', 'sourceLocation');
        assert.equal(dropParameters.sourceColumnElement.css('opacity'), 0.5, 'sourceColumnElement');
        assert.equal(dropParameters.targetColumnIndex, 1, 'targetColumnIndex');
        assert.equal(dropParameters.targetLocation, 'group', 'targetLocation');
        assert.ok(!this.draggingHeaderView._isDragging, 'is not dragged');
        assert.ok($draggingHeaderView.css('display', 'none'), 'draggingHeaderView is not displayed');
    });

    QUnit.test('Drop group panel to source order', function(assert) {
        //arrange
        var testElement = $('#container'),
            dropParameters,
            $draggingHeaderView;

        this.controller.drop = function(parameters) {
            if(this.allowDrop(parameters)) {
                dropParameters = parameters;
            }
        };

        this.controller.allowDrop = function(parameters) {
            if(parameters.targetLocation === parameters.sourceLocation && parameters.targetColumnIndex === parameters.sourceColumnIndex) {
                return false;
            }
            return true;
        };

        this.controller._rowsView = {};
        this.controller._rowsView.setRowsOpacity = function() { };
        this.controller._columnHeadersView.element = function() { return $('<div />'); };

        this.draggingHeaderView.render(testElement);

        this.draggingHeaderView.dragHeader({
            columnElement: $('<div/>'),
            sourceLocation: 'group',
            draggingPanels: this.draggingPanels,
            deltaX: 2,
            deltaY: 1,
            columnIndex: 1,
            sourceColumn: {
                caption: "TestDrag",
                allowReordering: true
            }
        });

        this.draggingHeaderView.moveHeader({
            jQueryEvent: {
                data: {
                    that: this.draggingHeaderView,
                    rootElement: testElement
                },
                preventDefault: function() { },
                pageX: -9900,
                pageY: 5,
                type: 'mouse'
            }
        });

        //act
        this.draggingHeaderView.dropHeader({
            jQueryEvent: {
                data: {
                    that: this.draggingHeaderView
                },
                pageX: -9900,
                pageY: 5,
                type: 'mouse'
            }
        });

        $draggingHeaderView = $(".dx-datagrid-drag-header");

        //assert
        assert.ok(!dropParameters, 'drop parameters');
        assert.ok(!this.draggingHeaderView._isDragging, 'is not dragged');
        assert.ok($draggingHeaderView.css('display', 'none'), 'draggingHeaderView is not displayed');
    });

    QUnit.test('Move drag group panel for left side of root container', function(assert) {
        //arrange
        var testElement = $('#container'),
            offsetParameters;

        this.controller._rowsView = {};
        this.controller._rowsView.setRowsOpacity = function() { };
        this.controller._columnHeadersView.element = function() { return $('<div />'); };

        this.draggingHeaderView.render(testElement);
        this.blockSeparatorView.render(testElement);

        this.draggingHeaderView.element().offset = function(parameters) {
            offsetParameters = parameters;
        };

        this.draggingHeaderView.dragHeader({
            columnElement: $('<div/>'),
            sourceLocation: 'group',
            draggingPanels: this.draggingPanels,
            columnIndex: 1,
            deltaX: 2,
            deltaY: 1,
            sourceColumn: {
                caption: "TestDrag",
                allowReordering: true
            }
        });

        //act
        this.draggingHeaderView.moveHeader({
            jQueryEvent: {
                data: {
                    that: this.draggingHeaderView,
                    rootElement: testElement
                },
                preventDefault: function() { },
                pageX: -10005,
                pageY: 5,
                type: 'mouse'
            }
        });

        //assert
        assert.deepEqual(offsetParameters, { left: -10007, top: 4 }, 'offset parameters');
    });

    QUnit.test('Move drag group panel for right side of root container', function(assert) {
        //arrange
        var testElement = $('#container'),
            offsetParameters;

        this.controller._rowsView = {};
        this.controller._rowsView.setRowsOpacity = function() { };
        this.controller._columnHeadersView.element = function() { return $('<div />'); };

        this.draggingHeaderView.render(testElement);
        this.blockSeparatorView.render(testElement);

        this.draggingHeaderView.element().offset = function(parameters) {
            offsetParameters = parameters;
        };

        this.draggingHeaderView.dragHeader({
            sourceLocation: 'group',
            draggingPanels: this.draggingPanels,
            columnIndex: 1,
            deltaX: 2,
            deltaY: 1,
            columnElement: $('<div/>'),
            sourceColumn: {
                caption: "TestDrag",
                allowReordering: true
            }
        });

        //act
        this.draggingHeaderView.moveHeader({
            jQueryEvent: {
                data: {
                    that: this.draggingHeaderView,
                    rootElement: testElement
                },
                preventDefault: function() { },
                pageX: -9000,
                pageY: 5,
                type: 'mouse'
            }
        });

        //assert
        assert.deepEqual(offsetParameters, { left: -9002, top: 4 }, 'offset parameters');
    });

    QUnit.test('Move drag header in empty group panel', function(assert) {
        //arrange
        var testElement = $('#container'),
            dropParameters;

        this.controller.drop = function(parameters) {
            dropParameters = parameters;
        };

        this.controller.allowDrop = function(parameters) {
            return true;
        };

        this.controller._rowsView = {};
        this.controller._rowsView.setRowsOpacity = function() { };
        this.controller._columnHeadersView.element = function() { return $('<div />'); };

        this.draggingHeaderView.render(testElement);
        this.blockSeparatorView.render(testElement);

        this.draggingHeaderView.dragHeader({
            sourceLocation: 'headers',
            draggingPanels: this.draggingPanels,
            columnIndex: 1,
            deltaX: 2,
            deltaY: 1,
            columnElement: $('<div/>'),
            sourceColumn: {
                caption: "TestDrag",
                allowReordering: true
            }
        });

        this.draggingHeaderView.moveHeader({
            jQueryEvent: {
                data: {
                    that: this.draggingHeaderView,
                    rootElement: testElement
                },
                preventDefault: function() { },
                pageX: -10000,
                pageY: 5,
                type: 'mouse'
            }
        });

        //act
        this.draggingHeaderView.dropHeader({
            jQueryEvent: {
                data: {
                    that: this.draggingHeaderView
                },
                pageX: -10000,
                pageY: 5,
                type: 'mouse'
            }
        });

        //assert
        assert.ok(dropParameters);
        assert.equal(dropParameters.sourceColumnIndex, 1);
        assert.equal(dropParameters.sourceLocation, 'headers');
        assert.equal(dropParameters.targetColumnIndex, 0);
        assert.equal(dropParameters.targetLocation, 'group');
    });

    QUnit.test("Dragging is not worked when column is resizing", function(assert) {

        //arrange
        var testElement = $('#container'),
            offsetParameters;

        this.controller._rowsView = {};
        this.controller._rowsView.setRowsOpacity = function() { };
        this.controller._columnHeadersView.element = function() { return $('<div />'); };

        this.draggingHeaderView.render(testElement);
        this.blockSeparatorView.render(testElement);

        this.draggingHeaderView.element().offset = function(parameters) {
            offsetParameters = parameters;
        };

        this.draggingHeaderView.dragHeader({
            sourceLocation: 'group',
            draggingPanels: this.draggingPanels,
            columnIndex: 1,
            deltaX: 2,
            deltaY: 1,
            columnElement: $('<div/>'),
            sourceColumn: {
                caption: "TestDrag",
                allowReordering: true
            }
        });

        //act
        this.columnsResizerController._isResizing = true;
        this.draggingHeaderView.moveHeader({
            jQueryEvent: {
                data: {
                    that: this.draggingHeaderView,
                    rootElement: testElement
                },
                preventDefault: function() { },
                pageX: -9000,
                pageY: 5,
                type: 'mouse'
            }
        });

        //assert
        assert.ok(!offsetParameters, 'offset parameters');
    });

    QUnit.test('Block separator move in group panel when dragging left', function(assert) {
        //arrange
        var testElement = $('#container'),
            blockSeparator;

        this.controller._rowsView = {};
        this.controller._rowsView.setRowsOpacity = function() { };
        this.controller._columnHeadersView.element = function() { return $('<div />'); };

        this.draggingHeaderView.render(testElement);
        this.blockSeparatorView.render(testElement);
        //this.headerPanel.render(testElement);

        this.draggingHeaderView.dragHeader({
            sourceLocation: 'group',
            draggingPanels: this.draggingPanels,
            columnIndex: 1,
            deltaX: 2,
            deltaY: 1,
            columnElement: $('<div/>'),
            sourceColumn: {
                caption: "TestDrag",
                allowReordering: true
            }
        });

        //assert
        blockSeparator = $('.dx-datagrid').children('.dx-block-separator');
        assert.ok(blockSeparator.length, 'has is separator');

        //act
        this.draggingHeaderView.moveHeader({
            jQueryEvent: {
                data: {
                    that: this.draggingHeaderView,
                    rootElement: testElement
                },
                preventDefault: function() { },
                pageX: -9900,
                pageY: 5,
                type: 'mouse'
            }
        });

        //assert
        assert.equal($("#itemsContainer").children().length, 3);
        assert.ok($("#itemsContainer").children().eq(1).hasClass('dx-block-separator'));
        blockSeparator = $('.dx-datagrid').children('.dx-block-separator');
        assert.ok(!blockSeparator.length, 'not has is separator');
    });

    QUnit.test('Check block separator visibility after loading', function(assert) {
        //arrange
        var testElement = $('#container'),
            $blockSeparator;

        this.controller._rowsView = {};
        this.controller._rowsView.setRowsOpacity = function() { };
        this.controller._columnHeadersView.element = function() { return $('<div />'); };

        this.draggingHeaderView.render(testElement);
        this.blockSeparatorView.render(testElement);

        this.draggingHeaderView.dragHeader({
            sourceLocation: 'group',
            draggingPanels: this.draggingPanels,
            columnIndex: 1,
            deltaX: 2,
            deltaY: 1,
            columnElement: $('<div/>'),
            sourceColumn: {
                caption: "TestDrag",
                allowReordering: true
            }
        });
        $blockSeparator = $('.dx-datagrid').children('.dx-block-separator');

        this.draggingHeaderView.moveHeader({
            jQueryEvent: {
                data: {
                    that: this.draggingHeaderView,
                    rootElement: testElement
                },
                preventDefault: function() { },
                pageX: -9900,
                pageY: 5,
                type: 'mouse'
            }
        });

        assert.notEqual($blockSeparator.css("display"), "none", 'separator is visible');
        this.dataController.loadingChanged.fire(false, "test");

        //assert
        assert.equal($blockSeparator.css("display"), "none", 'separator is hidden');
    });

    QUnit.test('Block separator move in group panel when dragging right', function(assert) {
        //arrange
        var testElement = $('#container'),
            blockSeparator;

        this.controller._rowsView = {};
        this.controller._rowsView.setRowsOpacity = function() { };
        this.controller._columnHeadersView.element = function() { return $('<div />'); };

        this.draggingHeaderView.render(testElement);
        this.blockSeparatorView.render(testElement);

        this.draggingHeaderView.dragHeader({
            sourceLocation: 'group',
            draggingPanels: this.draggingPanels,
            columnIndex: 1,
            deltaX: 2,
            deltaY: 1,
            columnElement: $('<div/>'),
            sourceColumn: {
                caption: "TestDrag",
                allowReordering: true
            }
        });

        //assert
        blockSeparator = $('.dx-datagrid').children('.dx-block-separator');
        assert.ok(blockSeparator.length, 'has is separator');

        //act
        this.draggingHeaderView.moveHeader({
            jQueryEvent: {
                data: {
                    that: this.draggingHeaderView,
                    rootElement: testElement
                },
                preventDefault: function() { },
                pageX: -9700,
                pageY: 5,
                type: 'mouse'
            }
        });

        //assert
        assert.equal($("#itemsContainer").children().length, 3);
        assert.ok($("#itemsContainer").children().eq(2).hasClass('dx-block-separator'));
        blockSeparator = $('.dx-datagrid').children('.dx-block-separator');
        assert.ok(!blockSeparator.length, 'not has is separator');
    });

    QUnit.test('Reset opacity for target element', function(assert) {
        //arrange
        var testElement = $('#container'),
            columnIndexOpacity,
            opacityValue;

        this.controller._rowsView = {};
        this.controller._columnHeadersView = { setRowsOpacity: noop };
        this.controller._rowsView.setRowsOpacity = function(columnIndex, value) {
            columnIndexOpacity = columnIndex;
            opacityValue = value;
        };
        this.controller._columnHeadersView.element = function() {
            return $('<div/>');
        };

        this.draggingHeaderView.render(testElement);
        this.blockSeparatorView.render(testElement);

        this.draggingHeaderView.dragHeader({
            sourceLocation: 'group',
            draggingPanels: this.draggingPanels,
            deltaX: 2,
            deltaY: 1,
            columnIndex: 1,
            index: 1,
            columnElement: $("#itemsContainer").children().eq(1),
            sourceColumn: {
                caption: "TestDrag",
                allowReordering: true
            }
        });

        this.draggingHeaderView.moveHeader({
            jQueryEvent: {
                data: {
                    that: this.draggingHeaderView,
                    rootElement: testElement
                },
                preventDefault: function() { },
                pageX: -9900,
                pageY: 5,
                type: 'mouse'
            }
        });

        assert.equal($("#itemsContainer").children().length, 3);
        assert.ok(!columnIndexOpacity);
        assert.ok(!opacityValue);
        assert.equal($("#itemsContainer").children().eq(2).css('opacity'), 0.5, 'opacity 0.5');

        //act
        this.draggingHeaderView.dropHeader({
            jQueryEvent: {
                data: {
                    that: this.draggingHeaderView
                },
                pageX: -9900,
                pageY: 5,
                type: 'mouse'
            }
        });

        //assert
        assert.equal($("#itemsContainer").children().length, 2);
        assert.equal(columnIndexOpacity, 1);
        assert.equal(opacityValue, '');
        assert.equal($("#itemsContainer").children().eq(1).css('opacity'), 1, 'opacity 1');
    });

    QUnit.test('Highlight column headers with allowReordering false, allowGrouping true when move the column from group panel in headers', function(assert) {
        //arrange
        var that = this,
            testElement = $('#container'),
            columnIndexOpacity,
            opacityValue;

        that.controller._rowsView = {};
        that.controller._columnHeadersView = {};
        that.controller._rowsView.setRowsOpacity = function(columnIndex, value) {
            columnIndexOpacity = columnIndex;
            opacityValue = value;
        };
        that.controller._columnHeadersView.element = function() {
            return that.draggingPanels[0].element().append($('<div />').addClass('dx-header-row'));
        };

        that.commonColumnSettings.allowReordering = false;
        that.commonColumnSettings.allowGrouping = true;

        that.draggingHeaderView.render(testElement);
        that.blockSeparatorView.render(testElement);

        that.draggingHeaderView.dragHeader({
            sourceLocation: 'group',
            draggingPanels: that.draggingPanels,
            deltaX: 2,
            deltaY: 1,
            columnIndex: 1,
            columnElement: $("#itemsContainer").children().eq(1),
            sourceColumn: {
                caption: "TestDrag",
                allowGrouping: true
            }
        });

        //act
        that.draggingHeaderView.moveHeader({
            jQueryEvent: {
                data: {
                    that: that.draggingHeaderView,
                    rootElement: testElement
                },
                preventDefault: function() { },
                pageX: -10000,
                pageY: 45,
                type: 'mouse'
            }
        });

        //assert
        assert.ok(that.draggingPanels[0].element().find('.dx-header-row').first().hasClass("dx-datagrid-drop-highlight"), 'has class dx-headers-drop-highlight');

        //act
        that.draggingHeaderView.moveHeader({
            jQueryEvent: {
                data: {
                    that: that.draggingHeaderView,
                    rootElement: testElement
                },
                preventDefault: function() { },
                pageX: -10000,
                pageY: 5,
                type: 'mouse'
            }
        });

        //assert
        assert.ok(!that.draggingPanels[0].element().find('.dx-header-row').first().hasClass("dx-datagrid-drop-highlight"), 'not has class dx-headers-drop-highlight');
    });

    //T107737
    QUnit.test('Highlight column headers when move the column with allowReordering false from group panel in headers', function(assert) {
        //arrange
        var that = this,
            testElement = $('#container'),
            columnIndexOpacity,
            opacityValue;

        that.controller._rowsView = {};
        that.controller._columnHeadersView = {};
        that.controller._rowsView.setRowsOpacity = function(columnIndex, value) {
            columnIndexOpacity = columnIndex;
            opacityValue = value;
        };
        that.controller._columnHeadersView.element = function() {
            return that.draggingPanels[0].element().append($('<div />').addClass('dx-header-row'));
        };

        that.commonColumnSettings.allowGrouping = true;

        that.draggingHeaderView.render(testElement);
        that.columnsSeparatorView.render(testElement);

        that.draggingHeaderView.dragHeader({
            sourceLocation: 'group',
            draggingPanels: that.draggingPanels,
            deltaX: 2,
            deltaY: 1,
            columnIndex: 1,
            columnElement: $("#itemsContainer").children().eq(1),
            sourceColumn: {
                caption: "TestDrag",
                allowReordering: false
            }
        });

        //act
        that.draggingHeaderView.moveHeader({
            jQueryEvent: {
                data: {
                    that: that.draggingHeaderView,
                    rootElement: testElement
                },
                preventDefault: function() { },
                pageX: -10000,
                pageY: 45,
                type: 'mouse'
            }
        });

        //assert
        assert.ok(!that.columnsSeparatorView.element().is(":visible"), "not visible columns separator");
        assert.ok(that.draggingPanels[0].element().find('.dx-header-row').first().hasClass("dx-datagrid-drop-highlight"), 'has class dx-headers-drop-highlight');
    });

    QUnit.test('Not highlight column headers with allowReordering false, allowGrouping true when drop the column from group panel in headers', function(assert) {
        //arrange
        var that = this,
            testElement = $('#container'),
            columnIndexOpacity,
            opacityValue;

        that.controller._rowsView = {};
        that.controller._columnHeadersView = { setRowsOpacity: noop };
        that.controller._rowsView.setRowsOpacity = function(columnIndex, value) {
            columnIndexOpacity = columnIndex;
            opacityValue = value;
        };
        that.controller._columnHeadersView.element = function() {
            return that.draggingPanels[0].element().append($('<div />').addClass('dx-header-row'));
        };

        that.commonColumnSettings.allowReordering = false;
        that.commonColumnSettings.allowGrouping = true;

        that.draggingHeaderView.render(testElement);
        that.blockSeparatorView.render(testElement);

        that.draggingHeaderView.dragHeader({
            sourceLocation: 'group',
            draggingPanels: that.draggingPanels,
            deltaX: 2,
            deltaY: 1,
            columnIndex: 1,
            columnElement: $("#itemsContainer").children().eq(1),
            sourceColumn: {
                caption: "TestDrag",
                allowGrouping: true
            }
        });

        //act
        that.draggingHeaderView.moveHeader({
            jQueryEvent: {
                data: {
                    that: that.draggingHeaderView,
                    rootElement: testElement
                },
                preventDefault: function() { },
                pageX: -10000,
                pageY: 45,
                type: 'mouse'
            }
        });

        //assert
        assert.ok(that.draggingPanels[0].element().find('.dx-header-row').first().hasClass("dx-datagrid-drop-highlight"), 'has class dx-headers-drop-highlight');

        //act
        this.draggingHeaderView.dropHeader({
            jQueryEvent: {
                data: {
                    that: this.draggingHeaderView
                },
                pageX: -9900,
                pageY: 45,
                type: 'mouse'
            }
        });

        //assert
        assert.ok(!that.draggingPanels[0].element().find('.dx-header-row').first().hasClass("dx-datagrid-drop-highlight"), 'not has class dx-headers-drop-highlight');
    });

    QUnit.test('Not highlight column headers with allowReordering false, allowGrouping true when move the column from headers in headers', function(assert) {
        //arrange
        var that = this,
            testElement = $('#container'),
            columnIndexOpacity,
            opacityValue;

        that.controller._rowsView = {};
        that.controller._columnHeadersView = { setRowsOpacity: noop };
        that.controller._rowsView.setRowsOpacity = function(columnIndex, value) {
            columnIndexOpacity = columnIndex;
            opacityValue = value;
        };
        that.controller._columnHeadersView.element = function() {
            return that.draggingPanels[0].element().append($('<div />').addClass('dx-header-row'));
        };

        that.commonColumnSettings.allowReordering = false;
        that.commonColumnSettings.allowGrouping = true;

        that.draggingHeaderView.render(testElement);
        that.blockSeparatorView.render(testElement);

        //act
        that.draggingHeaderView.dragHeader({
            sourceLocation: 'headers',
            draggingPanels: that.draggingPanels,
            deltaX: 2,
            deltaY: 1,
            columnIndex: 1,
            columnElement: $("#itemsContainer").children().eq(1),
            sourceColumn: {
                caption: "TestDrag",
                allowReordering: true
            }
        });

        that.draggingHeaderView.moveHeader({
            jQueryEvent: {
                data: {
                    that: that.draggingHeaderView,
                    rootElement: testElement
                },
                preventDefault: function() { },
                pageX: -10000,
                pageY: 45,
                type: 'mouse'
            }
        });

        //assert
        assert.ok(!that.draggingPanels[0].element().find('.dx-header-row').first().hasClass("dx-datagrid-drop-highlight"), 'not has class dx-headers-drop-highlight');
    });

    QUnit.test('Not highlight column headers with allowReordering true, allowGrouping true', function(assert) {
        //arrange
        var that = this,
            testElement = $('#container'),
            columnIndexOpacity,
            opacityValue;

        that.controller._rowsView = {};
        that.controller._columnHeadersView = {};
        that.controller._rowsView.setRowsOpacity = function(columnIndex, value) {
            columnIndexOpacity = columnIndex;
            opacityValue = value;
        };
        that.controller._columnHeadersView.element = function() {
            return that.draggingPanels[0].element().append($('<div />').addClass('dx-header-row'));
        };

        that.commonColumnSettings.allowReordering = true;
        that.commonColumnSettings.allowGrouping = true;

        that.draggingHeaderView.render(testElement);
        that.blockSeparatorView.render(testElement);

        that.draggingHeaderView.dragHeader({
            sourceLocation: 'group',
            draggingPanels: that.draggingPanels,
            deltaX: 2,
            deltaY: 1,
            columnIndex: 1,
            columnElement: $("#itemsContainer").children().eq(1),
            sourceColumn: {
                caption: "TestDrag",
                allowReordering: true
            }
        });

        //act
        that.draggingHeaderView.moveHeader({
            jQueryEvent: {
                data: {
                    that: that.draggingHeaderView,
                    rootElement: testElement
                },
                preventDefault: function() { },
                pageX: -10000,
                pageY: 45,
                type: 'mouse'
            }
        });

        //assert
        assert.ok(!that.draggingPanels[0].element().find('.dx-header-row').first().hasClass("dx-datagrid-drop-highlight"), 'not has class dx-headers-drop-highlight');
    });

    //T479973
    QUnit.test("Resubscribe to dragging after change of column option", function(assert) {
        //arrange
        var $testElement = $('#container');

        this.headerPanel.render($testElement);
        sinon.spy(this.draggingHeaderController, "_subscribeToEvents");

        //act
        this.columnsController.columnsChanged.fire({
            optionNames: {},
            changeTypes: {}
        });

        //assert
        assert.equal(this.draggingHeaderController._subscribeToEvents.callCount, 1, "subscribed to dragging");
    });
})();

//Column chooser reordering
(function() {
    QUnit.module("column chooser reordering", {
        beforeEach: function() {
            var that = this;

            that.commonColumnSettings = {
                allowHiding: true,
                allowReordering: true
            };

            that.options = {
                showColumnHeaders: true,
                commonColumnSettings: that.commonColumnSettings,
                columnChooser: {
                    enabled: true
                }
            };

            $('#container').css({ height: '500px' });

            that.draggingPanels = [new MockDraggingPanel({
                $element: $('<div/>'),
                columnElements: $("#itemsContainer").children(),
                columns: [{ allowHiding: true, allowReordering: true }, { allowHiding: true, allowReordering: true }],
                offset: {
                    top: 40
                },
                location: 'headers'
            }),
                new MockDraggingPanel({
                    $element: $('<div/>'),
                    columnElements: $("#itemsContainer").children(),
                    columns: [{ allowHiding: true, allowReordering: true }, { allowHiding: true, allowReordering: true }],
                    offset: {
                        top: 0,
                        bottom: 30
                    },
                    location: 'group'
                }),
                new MockDraggingPanel({
                    $element: $('<div/>'),
                    columnElements: $("#itemsContainerVertical").children(),
                    columns: [{ allowHiding: true, allowReordering: true }, { allowHiding: true, allowReordering: true }],
                    offset: {
                        left: -9900,
                        right: -9700,
                        top: -9500,
                        bottom: -9300
                    },
                    location: 'columnChooser',
                    scrollTop: 0
                })];

            setupDataGridModules(this, ['data', 'columns', 'columnHeaders', 'rows', 'headerPanel', 'grouping', 'gridView', 'columnsResizingReordering', 'columnChooser'], {
                initViews: true,
                controllers: {
                    data: new MockDataController({
                        rows: [{ values: ['', ''] }]
                    }),
                    columns: new MockColumnsController([], that.commonColumnSettings),
                    tablePosition: new MockTablePositionViewController()
                },
                views: {
                    draggingHeaderView: new TestDraggingHeader(that)
                }
            });

            that.controller = that.draggingHeaderController;
        }
    });

    QUnit.test('Get points by columns', function(assert) {
        //arrange
        var pointsByColumns;

        //act
        pointsByColumns = gridCore.getPointsByColumns($("#itemsContainerVertical").find("div"), false, true);

        //act, assert
        assert.equal(pointsByColumns.length, 3, "count points by columns");
        assert.equal(pointsByColumns[0].x, -10000, "points[0] x");
        assert.ok(pointsByColumns[0].y > -10000, "point[0] y");
        assert.equal(pointsByColumns[1].x, -10000, "points[1] x");
        assert.ok(pointsByColumns[1].y > pointsByColumns[0].y, "point[1] y");
        assert.equal(pointsByColumns[2].x, -10000, "points[2] x");
        assert.ok(pointsByColumns[2].y > pointsByColumns[1].y, "point[2] y");
    });

    QUnit.test('Dock column chooser to points', function(assert) {
        //arrange
        var testElement = $('#container'),
            options,
            $draggingHeaderView;

        this.controller.dock = function(params) {
            options = params;
        };

        this.draggingHeaderView.render(testElement);
        this.draggingHeaderView.dragHeader({
            columnElement: $('<div/>'),
            sourceLocation: 'columnChooser',
            draggingPanels: this.draggingPanels,
            deltaX: 2,
            deltaY: 1,
            sourceColumn: {
                caption: "TestDrag",
                allowHiding: true
            }
        });

        //act
        this.draggingHeaderView.moveHeader({
            jQueryEvent: {
                data: {
                    that: this.draggingHeaderView,
                    rootElement: testElement
                },
                preventDefault: function() { },
                pageX: -9800,
                pageY: -9490,
                type: 'mouse'
            }
        });
        $draggingHeaderView = $(".dx-datagrid-drag-header");

        //assert
        assert.equal(options.targetColumnIndex, -1, "targetColumnIndex");
        assert.roughEqual($draggingHeaderView.offset().left, -9802, 0.1, 'draggingHeaderView offset.left');
        assert.roughEqual($draggingHeaderView.offset().top, -9491, 0.1, 'draggingHeaderView offset.top');
        assert.ok($draggingHeaderView.css('display', ''), 'draggingHeaderView is displayed');
    });

    QUnit.test('Drop from column chooser to headers', function(assert) {
        //arrange
        var testElement = $('#container'),
            dropParameters,
            $draggingHeaderView;

        this.controller.drop = function(parameters) {
            dropParameters = parameters;
        };
        this.controller.allowDrop = function(parameters) {
            if(parameters.targetLocation === parameters.sourceLocation && parameters.targetColumnIndex === parameters.sourceColumnIndex) {
                return false;
            }
            return true;
        };
        this.controller._rowsView = {};
        this.controller._rowsView.setRowsOpacity = function() { };

        this.controller._columnHeadersView.element = function() { return $('<div />'); };

        this.draggingHeaderView.render(testElement);
        this.blockSeparatorView.render(testElement);

        this.draggingHeaderView.dragHeader({
            sourceLocation: 'columnChooser',
            draggingPanels: this.draggingPanels,
            deltaX: 2,
            deltaY: 1,
            columnIndex: 0,
            columnElement: $('<div />'),
            sourceColumn: {
                caption: "TestDrag",
                allowHiding: true,
                allowReordering: true
            }
        });

        //act
        this.draggingHeaderView.moveHeader({
            jQueryEvent: {
                data: {
                    that: this.draggingHeaderView,
                    rootElement: testElement
                },
                preventDefault: function() { },
                pageX: -9900,
                pageY: 50,
                type: 'mouse'
            }
        });

        this.draggingHeaderView.dropHeader({
            jQueryEvent: {
                data: {
                    that: this.draggingHeaderView
                },
                pageX: -9900,
                pageY: 50,
                type: 'mouse'
            }
        });

        $draggingHeaderView = $(".dx-datagrid-drag-header");

        //assert
        assert.equal(dropParameters.sourceColumnIndex, 0, 'sourceColumnIndex');
        assert.equal(dropParameters.sourceLocation, 'columnChooser', 'sourceLocation');
        assert.equal(dropParameters.sourceColumnElement.css('opacity'), 0.5, 'sourceColumnElement');
        assert.equal(dropParameters.targetColumnIndex, 1, 'targetColumnIndex');
        assert.equal(dropParameters.targetLocation, 'headers', 'targetLocation');
        assert.ok(!this.draggingHeaderView._isDragging, 'is not dragged');
        assert.ok($draggingHeaderView.css('display', 'none'), 'draggingHeaderView is not displayed');
    });

    QUnit.test('Drop from column chooser to group panel', function(assert) {
        //arrange
        var testElement = $('#container'),
            dropParameters,
            $draggingHeaderView;

        this.controller.drop = function(parameters) {
            dropParameters = parameters;
        };
        this.controller.allowDrop = function(parameters) {
            if(parameters.targetLocation === parameters.sourceLocation && parameters.targetColumnIndex === parameters.sourceColumnIndex) {
                return false;
            }
            return true;
        };
        this.controller._rowsView = {};
        this.controller._rowsView.setRowsOpacity = function() { };

        this.controller._columnHeadersView.element = function() { return $('<div />'); };

        this.draggingHeaderView.render(testElement);
        this.blockSeparatorView.render(testElement);

        this.draggingHeaderView.dragHeader({
            sourceLocation: 'columnChooser',
            draggingPanels: this.draggingPanels,
            deltaX: 2,
            deltaY: 1,
            columnIndex: 0,
            columnElement: $('<div />'),
            sourceColumn: {
                caption: "TestDrag",
                allowHiding: true
            }
        });

        //act
        this.draggingHeaderView.moveHeader({
            jQueryEvent: {
                data: {
                    that: this.draggingHeaderView,
                    rootElement: testElement
                },
                preventDefault: function() { },
                pageX: -9900,
                pageY: 10,
                type: 'mouse'
            }
        });

        this.draggingHeaderView.dropHeader({
            jQueryEvent: {
                data: {
                    that: this.draggingHeaderView
                },
                pageX: -9900,
                pageY: 10,
                type: 'mouse'
            }
        });

        $draggingHeaderView = $(".dx-datagrid-drag-header");

        //assert
        assert.equal(dropParameters.sourceColumnIndex, 0, 'sourceColumnIndex');
        assert.equal(dropParameters.sourceLocation, 'columnChooser', 'sourceLocation');
        assert.equal(dropParameters.sourceColumnElement.css('opacity'), 0.5, 'sourceColumnElement');
        assert.equal(dropParameters.targetColumnIndex, 1, 'targetColumnIndex');
        assert.equal(dropParameters.targetLocation, 'group', 'targetLocation');
        assert.ok(!this.draggingHeaderView._isDragging, 'is not dragged');
        assert.ok($draggingHeaderView.css('display', 'none'), 'draggingHeaderView is not displayed');
    });

    QUnit.test('Drop column chooser to source order', function(assert) {
        //arrange
        var testElement = $('#container'),
            dropParameters,
            $draggingHeaderView;

        this.controller.drop = function(parameters) {
            if(this.allowDrop(parameters)) {
                dropParameters = parameters;
            }
        };
        this.controller.allowDrop = function(parameters) {
            if(parameters.targetLocation === parameters.sourceLocation && (parameters.targetColumnIndex === parameters.sourceColumnIndex || parameters.targetColumnIndex < 0)) {
                return false;
            }
            return true;
        };
        this.controller._rowsView = {};
        this.controller._rowsView.setRowsOpacity = function() { };

        this.controller._columnHeadersView.element = function() { return $('<div />'); };

        this.draggingHeaderView.render(testElement);
        this.blockSeparatorView.render(testElement);

        this.draggingHeaderView.dragHeader({
            sourceLocation: 'columnChooser',
            draggingPanels: this.draggingPanels,
            deltaX: 2,
            deltaY: 1,
            columnIndex: 0,
            columnElement: $('<div />'),
            sourceColumn: {
                caption: "TestDrag",
                allowHiding: true
            }
        });

        //act
        this.draggingHeaderView.moveHeader({
            jQueryEvent: {
                data: {
                    that: this.draggingHeaderView,
                    rootElement: testElement
                },
                preventDefault: function() { },
                pageX: -9800,
                pageY: -9490,
                type: 'mouse'
            }
        });

        this.draggingHeaderView.dropHeader({
            jQueryEvent: {
                data: {
                    that: this.draggingHeaderView
                },
                pageX: -9800,
                pageY: -9490,
                type: 'mouse'
            }
        });

        $draggingHeaderView = $(".dx-datagrid-drag-header");

        //assert
        assert.ok(!dropParameters, 'drop parameters');
        assert.ok(!this.draggingHeaderView._isDragging, 'is not dragged');
        assert.ok($draggingHeaderView.css('display', 'none'), 'draggingHeaderView is not displayed');
    });

    QUnit.test('Move column chooser for down side of root container', function(assert) {
        //arrange
        var testElement = $('#container'),
            offsetParameters;

        this.controller._rowsView = {};
        this.controller._rowsView.setRowsOpacity = function() { };
        this.controller._columnHeadersView.element = function() { return $('<div />'); };

        this.draggingHeaderView.render(testElement);
        this.blockSeparatorView.render(testElement);

        this.draggingHeaderView.element().offset = function(parameters) {
            offsetParameters = parameters;
        };

        this.draggingHeaderView.dragHeader({
            columnElement: $('<div/>'),
            sourceLocation: 'columnChooser',
            draggingPanels: this.draggingPanels,
            columnIndex: 0,
            deltaX: 2,
            deltaY: 1,
            sourceColumn: {
                caption: "TestDrag",
                allowHiding: true
            }
        });

        //act
        this.draggingHeaderView.moveHeader({
            jQueryEvent: {
                data: {
                    that: this.draggingHeaderView,
                    rootElement: testElement
                },
                preventDefault: function() { },
                pageX: -9800,
                pageY: -9300,
                type: 'mouse'
            }
        });

        //assert
        assert.deepEqual(offsetParameters, { left: -9802, top: -9301 }, 'offset parameters');
    });

    QUnit.test('Move column chooser for up side of root container', function(assert) {
        //arrange
        var testElement = $('#container'),
            offsetParameters;

        this.controller._rowsView = {};
        this.controller._rowsView.setRowsOpacity = function() { };
        this.controller._columnHeadersView.element = function() { return $('<div />'); };

        this.draggingHeaderView.render(testElement);
        this.blockSeparatorView.render(testElement);

        this.draggingHeaderView.element().offset = function(parameters) {
            offsetParameters = parameters;
        };

        this.draggingHeaderView.dragHeader({
            columnElement: $('<div/>'),
            sourceLocation: 'columnChooser',
            draggingPanels: this.draggingPanels,
            columnIndex: 1,
            deltaX: 2,
            deltaY: 1,
            sourceColumn: {
                caption: "TestDrag",
                allowHiding: true
            }
        });

        //act
        this.draggingHeaderView.moveHeader({
            jQueryEvent: {
                data: {
                    that: this.draggingHeaderView,
                    rootElement: testElement
                },
                preventDefault: function() { },
                pageX: -9800,
                pageY: -9490,
                type: 'mouse'
            }
        });

        //assert
        assert.deepEqual(offsetParameters, { left: -9802, top: -9491 }, 'offset parameters');
    });

    /* QUnit.test('Block separator move in column chooser when dragging down', function (assert) {
        //arrange
        var testElement = $('#container'),
            blockSeparator;

        this.controller._rowsView = {};
        this.controller._rowsView.setRowsOpacity = function () { };
        this.controller._columnHeadersView.element = function () { return $('<div />'); };

        this.draggingHeaderView.render(testElement);
        this.blockSeparatorView.render(testElement);

        this.draggingHeaderView.dragHeader({
            sourceLocation: 'columnChooser',
            draggingPanels: this.draggingPanels,
            columnIndex: 0,
            deltaX: 2,
            deltaY: 1,
            columnElement: $('<div/>'),
            sourceColumn: {
                caption: "TestDrag",
                allowHiding: true
            }
        });

        //assert
        blockSeparator = $('.dx-datagrid').children('.dx-block-separator');
        assert.ok(blockSeparator.length, 'has is separator');

        //act
        this.draggingHeaderView.moveHeader({
            jQueryEvent: {
                data: {
                    that: this.draggingHeaderView,
                    rootElement: testElement
                },
                preventDefault: function () { },
                pageX: -9800,
                pageY: -9305,
                type: 'mouse'
            }
        });

        //assert
        assert.equal($("#itemsContainerVertical").children().length, 2);
        assert.ok($("#itemsContainerVertical").children().eq(2).hasClass('dx-block-separator'));
        blockSeparator = $('.dx-datagrid').children('.dx-block-separator');
        assert.ok(!blockSeparator.length, 'not has is separator');
    });

    QUnit.test('Block separator move in column chooser when dragging up', function (assert) {
        //arrange
        var testElement = $('#container'),
            blockSeparator;

        this.controller._rowsView = {};
        this.controller._rowsView.setRowsOpacity = function () { };
        this.controller._columnHeadersView.element = function () { return $('<div />'); };

        this.draggingHeaderView.render(testElement);
        this.blockSeparatorView.render(testElement);

        this.draggingHeaderView.dragHeader({
            sourceLocation: 'columnChooser',
            draggingPanels: this.draggingPanels,
            columnIndex: 1,
            deltaX: 2,
            deltaY: 1,
            columnElement: $('<div/>'),
            sourceColumn: {
                caption: "TestDrag",
                allowHiding: true
            }
        });

        //assert
        blockSeparator = $('.dx-datagrid').children('.dx-block-separator');
        assert.ok(blockSeparator.length, 'has is separator');

        //act
        this.draggingHeaderView.moveHeader({
            jQueryEvent: {
                data: {
                    that: this.draggingHeaderView,
                    rootElement: testElement
                },
                preventDefault: function () { },
                pageX: -9800,
                pageY: -9495,
                type: 'mouse'
            }
        });

        //assert
        assert.equal($("#itemsContainerVertical").children().length, 3);
        assert.ok($("#itemsContainerVertical").children().eq(0).hasClass('dx-block-separator'));
        blockSeparator = $('.dx-datagrid').children('.dx-block-separator');
        assert.ok(!blockSeparator.length, 'not has is separator');
    });
    */
    QUnit.test('Reset opacity for target element', function(assert) {
        //arrange
        var testElement = $('#container'),
            columnIndexOpacity,
            opacityValue;

        this.controller._rowsView = {};
        this.controller._columnHeadersView = { setRowsOpacity: noop };
        this.controller._rowsView.setRowsOpacity = function(columnIndex, value) {
            columnIndexOpacity = columnIndex;
            opacityValue = value;
        };
        this.controller._columnHeadersView.element = function() {
            return $('<div/>');
        };

        this.draggingHeaderView.render(testElement);
        this.blockSeparatorView.render(testElement);

        this.draggingHeaderView.dragHeader({
            sourceLocation: 'columnChooser',
            draggingPanels: this.draggingPanels,
            deltaX: 2,
            deltaY: 1,
            columnIndex: 0,
            index: 0,
            columnElement: $("#itemsContainerVertical").children().eq(0),
            sourceColumn: {
                caption: "TestDrag",
                allowHiding: true
            }
        });

        this.draggingHeaderView.moveHeader({
            jQueryEvent: {
                data: {
                    that: this.draggingHeaderView,
                    rootElement: testElement
                },
                preventDefault: function() { },
                pageX: -9800,
                pageY: -9305,
                type: 'mouse'
            }
        });

        assert.equal($("#itemsContainerVertical").children().length, 2);
        assert.ok(!columnIndexOpacity);
        assert.ok(!opacityValue);
        assert.equal($("#itemsContainerVertical").children().eq(0).css('opacity'), 0.5, 'opacity 0.5');

        //act
        this.draggingHeaderView.dropHeader({
            jQueryEvent: {
                data: {
                    that: this.draggingHeaderView
                },
                pageX: -9800,
                pageY: -9305,
                type: 'mouse'
            }
        });

        //assert
        assert.equal($("#itemsContainerVertical").children().length, 2);
        assert.equal(columnIndexOpacity, 0);
        assert.equal(opacityValue, '');
        assert.equal($("#itemsContainerVertical").children().eq(0).css('opacity'), 1, 'opacity 1');
    });

    QUnit.test('Highlight column headers with allowReordering false, allowGrouping false and allowHiding true when move the column from column chooser in headers', function(assert) {
        //arrange
        var that = this,
            testElement = $('#container');

        that.controller._rowsView = {};
        that.controller._columnHeadersView = {};
        that.controller._rowsView.setRowsOpacity = function() {
        };
        that.controller._columnHeadersView.element = function() {
            return that.draggingPanels[0].element().append($('<div />').addClass('dx-header-row'));
        };

        that.commonColumnSettings.allowReordering = false;

        that.draggingHeaderView.render(testElement);
        that.blockSeparatorView.render(testElement);

        that.draggingHeaderView.dragHeader({
            sourceLocation: 'columnChooser',
            draggingPanels: that.draggingPanels,
            deltaX: 2,
            deltaY: 1,
            columnIndex: 0,
            columnElement: $("#itemsContainer").children().eq(0),
            sourceColumn: {
                caption: "TestDrag",
                allowHiding: true
            }
        });

        //act
        that.draggingHeaderView.moveHeader({
            jQueryEvent: {
                data: {
                    that: that.draggingHeaderView,
                    rootElement: testElement
                },
                preventDefault: function() { },
                pageX: -10000,
                pageY: 45,
                type: 'mouse'
            }
        });

        //assert
        assert.ok(that.draggingPanels[0].element().find('.dx-header-row').first().hasClass("dx-datagrid-drop-highlight"), 'has class dx-headers-drop-highlight');

        //act
        that.draggingHeaderView.moveHeader({
            jQueryEvent: {
                data: {
                    that: that.draggingHeaderView,
                    rootElement: testElement
                },
                preventDefault: function() { },
                pageX: -9800,
                pageY: -9495,
                type: 'mouse'
            }
        });

        //assert
        assert.ok(!that.draggingPanels[0].element().find('.dx-header-row').first().hasClass("dx-datagrid-drop-highlight"), 'not has class dx-headers-drop-highlight');
    });

    QUnit.test('Not highlight column headers with allowReordering false, allowGrouping false and allowHiding true when drop the column from column chooser in headers', function(assert) {
        //arrange
        var that = this,
            testElement = $('#container');

        that.controller._rowsView = {};
        that.controller._columnHeadersView = { setRowsOpacity: noop };
        that.controller._rowsView.setRowsOpacity = function() {
        };
        that.controller._columnHeadersView.element = function() {
            return that.draggingPanels[0].element().append($('<div />').addClass('dx-header-row'));
        };

        that.commonColumnSettings.allowReordering = false;

        that.draggingHeaderView.render(testElement);
        that.blockSeparatorView.render(testElement);

        that.draggingHeaderView.dragHeader({
            sourceLocation: 'columnChooser',
            draggingPanels: that.draggingPanels,
            deltaX: 2,
            deltaY: 1,
            columnIndex: 0,
            columnElement: $("#itemsContainer").children().eq(0),
            sourceColumn: {
                caption: "TestDrag",
                allowHiding: true
            }
        });

        //act
        that.draggingHeaderView.moveHeader({
            jQueryEvent: {
                data: {
                    that: that.draggingHeaderView,
                    rootElement: testElement
                },
                preventDefault: function() { },
                pageX: -10000,
                pageY: 45,
                type: 'mouse'
            }
        });

        //assert
        assert.ok(that.draggingPanels[0].element().find('.dx-header-row').first().hasClass("dx-datagrid-drop-highlight"), 'has class dx-headers-drop-highlight');

        //act
        this.draggingHeaderView.dropHeader({
            jQueryEvent: {
                data: {
                    that: this.draggingHeaderView
                },
                pageX: -10000,
                pageY: 45,
                type: 'mouse'
            }
        });

        //assert
        assert.ok(!that.draggingPanels[0].element().find('.dx-header-row').first().hasClass("dx-datagrid-drop-highlight"), 'not has class dx-headers-drop-highlight');
    });

    QUnit.test('Not highlight column headers with allowReordering true, allowHiding true', function(assert) {
        //arrange
        var that = this,
            testElement = $('#container');

        that.controller._rowsView = {};
        that.controller._columnHeadersView = {};
        that.controller._rowsView.setRowsOpacity = function() {
        };
        that.controller._columnHeadersView.element = function() {
            return that.draggingPanels[0].element().append($('<div />').addClass('dx-header-row'));
        };

        that.draggingHeaderView.render(testElement);
        that.blockSeparatorView.render(testElement);

        that.draggingHeaderView.dragHeader({
            sourceLocation: 'columnChooser',
            draggingPanels: that.draggingPanels,
            deltaX: 2,
            deltaY: 1,
            columnIndex: 0,
            columnElement: $("#itemsContainer").children().eq(0),
            sourceColumn: {
                caption: "TestDrag",
                allowHiding: true,
                allowReordering: true
            }
        });

        //act
        that.draggingHeaderView.moveHeader({
            jQueryEvent: {
                data: {
                    that: that.draggingHeaderView,
                    rootElement: testElement
                },
                preventDefault: function() { },
                pageX: -10000,
                pageY: 45,
                type: 'mouse'
            }
        });

        //assert
        assert.ok(!that.draggingPanels[0].element().find('.dx-header-row').first().hasClass("dx-datagrid-drop-highlight"), 'not has class dx-headers-drop-highlight');
    });
})();
