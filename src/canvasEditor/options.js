import { EditorMode } from '@hufe921/canvas-editor'
const ITableOption = {
  tdPadding: [0, 5, 5, 5] ,// 单元格内边距。默认：[0, 5, 5, 5]
  defaultTrMinHeight: 42 ,// 默认表格行最小高度。默认：42
  defaultColMinWidth: 40 ,// 默认表格列最小宽度（整体宽度足够时应用，否则会按比例缩小）。默认：40
}
const IHeader = {
  // top: 30 ,// 距离页面顶部大小。默认：30
  // maxHeightRadio: MaxHeightRatio ,// 占页面最大高度比。默认：HALF
  disabled: true ,// 是否禁用
}
const IFooter = {
  // bottom: 30 ,// 距离页面底部大小。默认：30
  // maxHeightRadio: MaxHeightRatio ,// 占页面最大高度比。默认：HALF
  disabled: true ,// 是否禁用
}
const IEditorOption = {
    mode: EditorMode.READONLY ,// 编辑器模式：编辑、清洁（不显示视觉辅助元素。如：分页符）、只读、表单（仅控件内可编辑）、打印（不显示辅助元素、未书写控件及前后括号）。默认：编辑
    // defaultType: string ,// 默认元素类型。默认：TEXT
    // defaultColor: '#000' ,// 默认字体颜色。默认：#000000
    // defaultFont: string ,// 默认字体。默认：Microsoft YaHei
    // defaultSize: number ,// 默认字号。默认：16
    // minSize: number ,// 最小字号。默认：5
    // maxSize: number ,// 最大字号。默认：72
    // defaultBasicRowMarginHeight: number ,// 默认行高。默认：8
    // defaultRowMargin: number ,// 默认行间距。默认：1
    // defaultTabWidth: number ,// 默认tab宽度。默认：32
    // width: number ,// 纸张宽度。默认：794
    // height: number ,// 纸张高度。默认：1123
    // scale: number ,// 缩放比例。默认：1
    // pageGap: number ,// 纸张间隔。默认：20
    // underlineColor: string ,// 下划线颜色。默认：#000000
    // strikeoutColor: string ,// 删除线颜色。默认：#FF0000
    // rangeColor: string ,// 选区颜色。默认：#AECBFA
    // rangeAlpha: number ,// 选区透明度。默认：0.6
    // rangeMinWidth: number ,// 选区最小宽度。默认：5
    // searchMatchColor: string ,// 搜索高亮颜色。默认：#FFFF00
    // searchNavigateMatchColor: string ,// 搜索导航高亮颜色。默认：#AAD280
    // searchMatchAlpha: number ,// 搜索高亮透明度。默认：0.6
    // highlightAlpha: number ,// 高亮元素透明度。默认：0.6
    // resizerColor: string ,// 图片尺寸器颜色。默认：#4182D9
    // resizerSize: number ,// 图片尺寸器大小。默认：5
    // marginIndicatorSize: number ,// 页边距指示器长度。默认：35
    // marginIndicatorColor: string ,// 页边距指示器颜色。默认：#BABABA
    // margins: IMargin ,// 页面边距。默认：[100, 120, 100, 120]
    // pageMode: PageMode ,// 纸张模式：连页、分页。默认：分页
    // defaultHyperlinkColor: string ,// 默认超链接颜色。默认：#0000FF
    // table: ITableOption ,// 表格配置。{tdPadding:IPadding; defaultTrMinHeight:number; defaultColMinWidth:number}
    header: IHeader ,// 页眉信息。{top:number; maxHeightRadio:MaxHeightRatio;}
    footer: IFooter ,// 页脚信息。{bottom:number; maxHeightRadio:MaxHeightRatio;}
    // pageNumber: IPageNumber ,// 页码信息。{bottom:number; size:number; font:string; color:string; rowFlex:RowFlex; format:string; numberType:NumberType;}
    // paperDirection: PaperDirection ,// 纸张方向：纵向、横向
    // inactiveAlpha: number ,// 正文内容失焦时透明度。默认值：0.6
    // historyMaxRecordCount: number ,// 历史（撤销重做）最大记录次数。默认：100次
    // printPixelRatio: number ,// 打印像素比率（值越大越清晰，但尺寸越大）。默认：3
    // maskMargin: IMargin ,// 编辑器上的遮盖边距（如悬浮到编辑器上的菜单栏、底部工具栏）。默认：[0, 0, 0, 0]
    // letterClass: string[] ,// 排版支持的字母类。默认：a-zA-Z。内置可选择的字母表类：LETTER_CLASS
    // contextMenuDisableKeys: string[] ,// 禁用的右键菜单。默认：[]
    // scrollContainerSelector: string ,// 滚动区域选择器。默认：document
    // wordBreak: WordBreak ,// 单词与标点断行：BREAK_WORD首行不出现标点&单词不拆分、BREAK_ALL按字符宽度撑满后折行。默认：BREAK_WORD
    // watermark: IWatermark ,// 水印信息。{data:string; color:string; opacity:number; size:number; font:string;}
    // control: IControlOption ,// 控件信息。 {placeholderColor:string; bracketColor:string; prefix:string; postfix:string; borderWidth: number; borderColor: string;}
    // checkbox: ICheckboxOption ,// 复选框信息。{width:number; height:number; gap:number; lineWidth:number; fillStyle:string; strokeStyle: string;}
    // radio: IRadioOption ,// 单选框信息。{width:number; height:number; gap:number; lineWidth:number; fillStyle:string; strokeStyle: string;}
    // cursor: ICursorOption ,// 光标样式。{width: number; color: string; dragWidth: number; dragColor: string;}
    // title: ITitleOption ,// 标题配置。{ defaultFirstSize: number; defaultSecondSize: number; defaultThirdSize: number defaultFourthSize: number; defaultFifthSize: number; defaultSixthSize: number;}
    // placeholder: IPlaceholder ,// 编辑器空白占位文本
    // group: IGroup ,// 成组配置。{opacity:number; backgroundColor:string; activeOpacity:number; activeBackgroundColor:string; disabled:boolean}
    // pageBreak: IPageBreak ,// 分页符配置。{font:string; fontSize:number; lineDash:number[];}
    // zone: IZoneOption ,// 编辑器区域配置。{tipDisabled:boolean;}
    // background: IBackgroundOption ,// 背景配置。{color:string; image:string; size:BackgroundSize; repeat:BackgroundRepeat;}。默认：{color: '#FFFFFF'}
    // lineBreak: ILineBreakOption ,// 换行符配置。{disabled:boolean; color:string; lineWidth:number;}
    // separator: ISeparatorOption ,// 分隔符配置。{lineWidth:number; strokeStyle:string;}
  }
  export {IEditorOption, ITableOption,IHeader, IFooter }