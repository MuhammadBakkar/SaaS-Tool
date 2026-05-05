

/*
* Licensed to the Apache Software Foundation (ASF) under one
* or more contributor license agreements.  See the NOTICE file
* distributed with this work for additional information
* regarding copyright ownership.  The ASF licenses this file
* to you under the Apache License, Version 2.0 (the
* "License"); you may not use this file except in compliance
* with the License.  You may obtain a copy of the License at
*
*   http://www.apache.org/licenses/LICENSE-2.0
*
* Unless required by applicable law or agreed to in writing,
* software distributed under the License is distributed on an
* "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
* KIND, either express or implied.  See the License for the
* specific language governing permissions and limitations
* under the License.
*/


/**
 * AUTO-GENERATED FILE. DO NOT MODIFY.
 */
(function(root, factory) {
    if (typeof define === 'function' && define.amd) {
        // AMD. Register as an anonymous module.
        define(['exports', 'echarts'], factory);
    } else if (
        typeof exports === 'object' &&
        typeof exports.nodeName !== 'string'
    ) {
        // CommonJS
        factory(exports, require('echarts/lib/echarts'));
    } else {
        // Browser globals
        factory({}, root.echarts);
    }
})(this, function(exports, echarts) {


/**
 * Language: Arabic.
 */

var localeObj = {

    time: {
        month: [
            'يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو',
            'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'
        ],
        monthAbbr: [
            'يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو',
            'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'
        ],
        dayOfWeek: [
            'الأحد', 'الإثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت'
        ],
        dayOfWeekAbbr: [
            'الأحد', 'الإثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت'
        ]
    },
    legend: {
        selector: {
            all: 'تحديد الكل',
            inverse: 'عكس التحديد'
        }
    },
    toolbox: {
        brush: {
            title: {
                rect: 'تحديد صندوقي',
                polygon: 'تحديد حلقي',
                lineX: 'تحديد أفقي',
                lineY: 'تحديد عمودي',
                keep: 'الاحتفاظ بالمحدد',
                clear: 'إلغاء التحديد'
            }
        },
        dataView: {
            title: 'عرض البيانات',
            lang: ['عرض البيانات', 'إغلاق', 'تحديث']
        },
        dataZoom: {
            title: {
                zoom: 'تكبير',
                back: 'استعادة التكبير'
            }
        },
        magicType: {
            title: {
                line: 'خطوط',
                bar: 'أشرطة',
                stack: 'تكديس',
                tiled: 'مربعات'
            }
        },
        restore: {
            title: 'استعادة'
        },
        saveAsImage: {
            title: 'حفظ كملف صورة',
            lang: ['للحفظ كصورة انقر  بالزر الأيمن']
        }
    },
    series: {
        typeNames: {
            pie: 'رسم بياني دائري',
            bar: 'رسم بياني شريطي',
            line: 'رسم بياني خطي',
            scatter: 'نقاط مبعثرة',
            effectScatter: 'نقاط مبعثرة متموجة',
            radar: 'رسم بياني راداري',
            tree: 'شجرة',
            treemap: 'مخطط شجري',
            boxplot: 'مخطط صندوقي',
            candlestick: 'مخطط شمعدان',
            k: 'رسم بياني خطي من النوع K',
            heatmap: 'خريطة حرارية',
            map: 'خريطة',
            parallel: 'خريطة الإحداثيات المتناظرة',
            lines: 'خطوط',
            graph: 'مخطط علائقي',
            sankey: 'مخطط ثعباني',
            funnel: 'مخطط هرمي',
            gauge: 'مقياس',
            pictorialBar: 'مخطط مصوّر',
            themeRiver: 'نمط خريطة النهر',
            sunburst: 'مخطط شمسي',
            custom: 'مخطط مخصص',
            chart: 'م�