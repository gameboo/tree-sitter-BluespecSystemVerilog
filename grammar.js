sepList1 = (sep, item) => seq(item, repeat(seq(sep, item)))
commaSepList1 = item => sepList1(',', item)
sepList = (sep, item) => optional(sepList1(sep, item))
commaSepList = item => sepList(',', item)

module.exports = grammar({
  name: 'BluespecSystemVerilog'
, rules: {
  // outter-most bsv package
    bsv_package: $ => seq( 'package', field('name', $.bsv_packageIde), ';'
                         , repeat($.bsv_exportDecl)
                         , repeat($.bsv_importDecl)
                         , repeat($.bsv_packageStmt)
                         , 'endpackage', optional(seq(':', $.bsv_packageIde)) )
  , bsv_packageIde: $ => $._bsv_Identifier
  // exports
  , bsv_exportDecl: $ => seq('export', commaSepList1($.bsv_exportItem), ';')
  , bsv_exportItem: $ => choice( seq($._bsv_identifier, optional('(..)'))
                               , seq($._bsv_Identifier, optional('(..)'))
                               , seq($.bsv_packageIde, '::', '*'))
  // imports
  , bsv_importDecl: $ => seq('import', commaSepList1($.bsv_importItem), ';')
  , bsv_importItem: $ => seq($.bsv_packageIde, '::', '*')
  // package statements
  , bsv_packageStmt: $ => choice( $.bsv_moduleDef
                                , $.bsv_interfaceDecl
                                , $.bsv_typeDef
                                , $.bsv_topVarDecl
                                , $.bsv_varAssign
                                , $.bsv_functionDef
                                , $.bsv_typeclassDef
                                , $.bsv_typeclassInstanceDef
                                // TODO , $.bsv_externModuleImport
                                )
  // variable declaration
  , bsv_topVarDecl: $ =>
      seq($.bsv_typeConcrete, commaSepList1($.bsv_varInit), ';')
  , bsv_varDecl: $ => seq($.bsv_type, commaSepList1($.bsv_varInit), ';')
  , bsv_varInit: $ =>
      seq($._bsv_identifier, optional($.bsv_arrayDims)
                           , optional(seq('=', $.bsv_expression)))
  , bsv_arrayDims: $ => repeat1(seq('[', $.bsv_expression, ']'))
  // varible assignment
  , bsv_varAssign: $ => seq($.bsv_lValue, '=', $.bsv_expression, ';')
  , bsv_lValue: $ => choice( $._bsv_identifier
                           , seq($.bsv_lValue, '.', $._bsv_identifier)
                           , seq($.bsv_lValue, '[', $.bsv_expression, ']')
                           , seq($.bsv_lValue, '[', $.bsv_expression
                                             , ':', $.bsv_expression, ']')
                           )
  // user-defined types
  , bsv_typeDef: $ => choice( $.bsv_typedefSynonym
                            , $.bsv_typedefEnum
                            , $.bsv_typedefStruct
                            , $.bsv_typedefTaggedUnion )
  , bsv_derives: $ =>
      seq('deriving', '(', commaSepList1($.bsv_typeclassIde), ')')
  , bsv_typedefSynonym: $ =>
      seq( 'typedef', $.bsv_type
         , $.bsv_typeConcreteIde, optional($.bsv_typeFormals), ';')
  , bsv_typeFormals: $ =>
      seq( '#', '('
         , commaSepList1(seq(optional('numeric'), 'type', $.bsv_typeVarIde))
         , ')' )
  , bsv_typedefEnum: $ =>
      seq( 'typedef', 'enum', '{'
         , commaSepList1($.bsv_typedefEnumElement)
         , '}', $._bsv_Identifier, optional($.bsv_derives), ';' )
  , bsv_typedefEnumElement: $ =>
      choice( seq($._bsv_Identifier, optional(seq('=', $.bsv_intLiteral)))
            , seq( $._bsv_Identifier, '[', $.bsv_intLiteral, ']'
                 , optional(seq('=', $.bsv_intLiteral)) )
            , seq( $._bsv_Identifier, '[', $.bsv_intLiteral
                                    , ':', $.bsv_intLiteral, ']'
                 , optional(seq('=', $.bsv_intLiteral)) )
            )
  , bsv_typedefStruct: $ =>
      seq( 'typedef', 'struct', '{'
         , repeat($.bsv_structMember), '}'
         , $.bsv_typeConcreteIde, optional($.bsv_typeFormals)
         , optional($.bsv_derives), ';' )
  , bsv_typedefTaggedUnion: $ =>
      seq( 'typedef', 'union', 'tagged', '{'
         , repeat($.bsv_unionMember), '}'
         , $.bsv_typeConcreteIde, optional($.bsv_typeFormals)
         , optional($.bsv_derives), ';' )
  , bsv_structMember: $ => choice( seq($.bsv_type, $._bsv_identifier, ';')
                                 , seq($.bsv_subStruct, $._bsv_identifier, ';')
                                 , seq($.bsv_subUnion, $._bsv_identifier, ';')
                                 , seq('void', $._bsv_identifier, ';')
                                 )
  , bsv_unionMember: $ =>
      choice( seq($.bsv_type, $._bsv_Identifier, ';')
            , seq($.bsv_subStruct, $._bsv_Identifier, ';')
            , seq($.bsv_subUnion, $._bsv_Identifier, ';')
            , seq('void', $._bsv_Identifier, ';')
            )
  , bsv_subStruct: $ =>
      seq('struct', '{', repeat($.bsv_structMember), '}')
  , bsv_subUnion: $ =>
      seq('union', 'tagged', '{', repeat($.bsv_unionMember), '}')
  // module definition
  , bsv_moduleDef: $ => seq( optional($.bsv_attributeInstances)
                           , $.bsv_moduleProto
                           , repeat($.bsv_moduleStmt)//repeat1($.bsv_moduleStmt)
                           , 'endmodule', optional(seq(':', $._bsv_identifier)) )
  , bsv_moduleProto: $ => seq( 'module'
                             , optional(seq('[', $.bsv_type, ']'))
                             , $._bsv_identifier
                             , optional($.bsv_moduleFormalParams)
                             , '(', optional($.bsv_moduleFormalArgs), ')'
                             , optional($.bsv_provisos)
                             , ';' )
  , bsv_moduleFormalParams: $ =>
      seq('#', '(', commaSepList1($.bsv_moduleFormalParam), ')')
  , bsv_moduleFormalParam: $ => seq( optional($.bsv_attributeInstances)
                                   , optional('parameter')
                                   , $.bsv_type, $._bsv_identifier )
  , bsv_moduleFormalArgs: $ =>
      choice( seq(optional($.bsv_attributeInstances), $.bsv_type)
            , commaSepList1(seq( optional($.bsv_attributeInstances)
                               , $.bsv_type, $._bsv_identifier )) )
  // module statements
  , bsv_moduleStmt: $ => 'TODO'
  // function definition
  , bsv_functionDef: $ =>
      seq( optional($.bsv_attributeInstances)
         , $.bsv_functionProto
         , $.bsv_functionBody
         , 'endfunction', optional(seq(':', $._bsv_identifier)) )
  , bsv_functionProto: $ =>
      seq( 'function', $.bsv_type, $._bsv_identifier
         , '(', commaSepList(seq($.bsv_type, $._bsv_identifier)), ')'
         , optional($.bsv_provisos), ';' )
  , bsv_functionBody: $ => repeat1($.bsv_functionBodyStmt)
  //, bsv_functionBody: $ => choice( $.bsv_actionBlock
  //                               , $.bsv_actionValueBlock
  //                               , repeat($.bsv_functionBodyStmt) )
  , bsv_functionBodyStmt: $ =>
      choice( $.bsv_returnStmt
            //, $.bsv_varDecl
            //, $.bsv_varAssign
            //, $.bsv_functionDef
            //, $.bsv_moduleDef
            , 'TODO' )
  , bsv_returnStmt: $ => seq('return', $.bsv_expression, ';')
  // typeclass declaration
  , bsv_typeclassDef: $ =>
      seq( 'typeclass', $.bsv_typeclassIde, $.bsv_typeFormals
         , optional($.bsv_provisos), optional($.bsv_typedepends), ';'
         , repeat($.bsv_overloadedDef)
         , 'endtypeclass', optional(seq(':', $.bsv_typeclassIde)) )
  , bsv_typeclassIde: $ => $._bsv_Identifier
  , bsv_typedepends: $ =>
      seq('dependencies', '(', commaSepList1($.bsv_typedepend), ')')
  , bsv_typedepend: $ => seq($.bsv_typelist, 'determines', $.bsv_typelist)
  , bsv_typelist: $ =>
      choice($.bsv_typeVarIde,  seq('(', commaSepList1($.bsv_typeVarIde), ')'))
  , bsv_overloadedDef: $ =>
      choice($.bsv_functionProto, $.bsv_moduleProto, $.bsv_varDecl)
  , bsv_typeclassInstanceDef: $ =>
      seq( 'instance', $.bsv_typeclassIde
         , '#', '(', commaSepList1($.bsv_type), ')'
         , optional($.bsv_provisos), ';'
         , repeat(choice($.bsv_varAssign, $.bsv_functionDef, $.bsv_moduleDef))
         , 'endinstance', optional(seq(':', $.bsv_typeclassIde)) )
  // expressions
  , bsv_expression: $ =>
      choice($.bsv_condExpr, $.bsv_operatorExpr, $.bsv_exprPrimary)
  , bsv_exprPrimary: $ =>
      choice( $._bsv_identifier
            , $.bsv_intLiteral
            , $.bsv_realLiteral
            , $.bsv_stringLiteral
            // TODO, $.bsv_systemFunctionCall
            , '?'
            // TODO, $.bsv_bitConcat
            // TODO, $.bsv_bitSelect
            // TODO, $.bsv_beginEndExpr
            // TODO, $.bsv_actionBlock
            // TODO, $.bsv_actionValueBlock
            // TODO, $.bsv_functionCall
            // TODO, $.bsv_methodCall
            // TODO, $.bsv_typeAssertion
            // TODO, $.bsv_structExpr
            // TODO, seq($.bsv_exprPrimary, '.', _bsv_identifier)
            // TODO, $.bsv_taggedUnionExpr
            // TODO, $.bsv_interfaceExpr
            // TODO, $.bsv_rulesExpr
            // TODO, $.bsv_seqFsmStmt
            // TODO, $.bsv_parFsmStmt
            // TODO, seq('valueof', '(', bsv_type, ')')
            // TODO, seq('valueOf', '(', bsv_type, ')')
            // TODO, seq('(', bsv_expression, ')')
            )
  , bsv_condExpr: $ =>
      prec(9, seq( $.bsv_condPredicate, '?'
                 , prec(10, $.bsv_expression), ':'
                 , prec(10, $.bsv_expression) ))
  , bsv_condPredicate: $ => sepList1('&&&', prec.right(9, $.bsv_exprOrCondPattern))
  , bsv_exprOrCondPattern: $ =>
      choice($.bsv_expression, seq($.bsv_expression, 'matches', $.bsv_pattern))
  , bsv_operatorExpr: $ =>
      choice( prec(10, seq($.bsv_unop, $.bsv_expression))
            , prec.left(1, seq($.bsv_expression, $.bsv_binop, $.bsv_expression)) )
  , bsv_unop: $ =>
      choice("+", "-", "!", "~", "&", "~&", "|", "~|", "^", "^~", "~^")
  , bsv_binop: $ =>
      prec.left(choice( "*", "/", "%", "+", "-", "<<", ">>"
                      , "<=", ">=", "<", ">", "==", "!="
                      , "&", "^", "^~", "~^", "|", "&&", "||" ))
  // interfaces
  , bsv_interfaceDecl: $ =>
      seq( optional($.bsv_attributeInstances), 'interface'
         , $.bsv_typeConcreteIde, optional($.bsv_typeFormals), ';'
         , repeat($.bsv_interfaceMemberDecl)
         , 'endinterface'
         , optional(seq(':', $.bsv_typeConcreteIde)) )
  , bsv_interfaceMemberDecl: $ =>
      choice($.bsv_methodProto, $.bsv_subinterfaceDecl)
  , bsv_methodProto: $ =>
      seq( optional($.bsv_attributeInstances), 'method'
         , $.bsv_type, $._bsv_identifier
         , '(', commaSepList($.bsv_methodProtoFormal), ')', ';' )
  , bsv_methodProtoFormal: $ =>
      seq(optional($.bsv_attributeInstances), $.bsv_type, $._bsv_identifier)
  , bsv_subinterfaceDecl: $ =>
      seq( optional($.bsv_attributeInstances), 'interface'
         , $.bsv_type, $._bsv_identifier, ';' )
  // types
  , bsv_type: $ =>
      choice( seq( $.bsv_typeIde
                 , optional(seq('#', '(', commaSepList1($.bsv_type), ')')) )
            , $.bsv_typeNat
            , seq('bit', '[', $.bsv_typeNat, ':', $.bsv_typeNat, ']') )
  , bsv_typeConcrete: $ =>
      choice( seq( $.bsv_typeConcreteIde
                 , optional(seq( '#', '('
                               , commaSepList1($.bsv_typeConcrete), ')')) )
            , $.bsv_typeNat
            , seq('bit', '[', $.bsv_typeNat, ':', $.bsv_typeNat, ']') )
  , bsv_typeVarIde: $ => $._bsv_identifier
  , bsv_typeConcreteIde: $ => $._bsv_Identifier
  , bsv_typeIde: $ => choice($.bsv_typeConcreteIde, $.bsv_typeVarIde)
  , bsv_typeNat: $ => /[0-9]+/
  // pattern matching
  //, bsv_pattern: $ => choice( seq('.', token.immediate($._bsv_identifier))
  , bsv_pattern: $ => choice( seq('.', $._bsv_identifier)
                            , '.*'
                            , $.bsv_constantPattern
                            , $.bsv_taggedUnionPattern
                            , $.bsv_structPattern
                            , $.bsv_tuplePattern )
  , bsv_constantPattern: $ => choice( $.bsv_intLiteral
                                    , $.bsv_realLiteral
                                    , $.bsv_stringLiteral
                                    , $._bsv_Identifier )
  , bsv_taggedUnionPattern: $ =>
      seq('tagged', $._bsv_Identifier, optional($.bsv_pattern))
  , bsv_structPattern: $ =>
      seq( $._bsv_Identifier, '{'
         , commaSepList1(seq($._bsv_identifier, ':', $.bsv_pattern))
         , '}' )
  , bsv_tuplePattern: $ => seq('{', commaSepList1($.bsv_pattern), '}')
  // provisos
  , bsv_provisos: $ => seq('provisos', '(', commaSepList1($.bsv_proviso), ')')
  , bsv_proviso: $ =>
      seq($.bsv_typeclassIde, '#', '(', commaSepList1($.bsv_type), ')')
  // attributes, guiding the compiler
  , bsv_attributeInstances: $ => repeat1($.bsv_attributeInstance)
  , bsv_attributeInstance: $ => seq('(*', commaSepList1($.bsv_attrSpec), '*)')
  , bsv_attrSpec: $ => seq($.bsv_attrName, optional(seq('=', $.bsv_expression)))
  , bsv_attrName: $ => choice($._bsv_identifier, $._bsv_Identifier)
  // integer literals
  , bsv_intLiteral: $ => choice( "'0"
                               , "'1"
                               , $.bsv_sizedIntLiteral
                               , $.bsv_unsizedIntLiteral )
  , bsv_sizedIntLiteral: $ => seq($.bsv_bitWidth, $.bsv_baseLiteral)
  , bsv_unsizedIntLiteral: $ =>
      choice( seq(optional($.bsv_sign), $.bsv_baseLiteral)
            , seq(optional($.bsv_sign), /[0-9]+/) )
  , bsv_baseLiteral: $ =>
      choice( seq(/'[dD]/, /[0-9_]*/)
            , seq(/'[hH]/, /[0-9a-fA-F_]*/)
            , seq(/'[oO]/, /[0-7_]*/)
            , seq(/'[bB]/, /[01_]*/)
            )
  , bsv_decNum: $ => /[0-9][0-9_]*/
  , bsv_bitWidth: $ => /[0-9]+/
  , bsv_sign: $ => /[\+\-]/
  // real literals
  , bsv_realLiteral: $ => choice( /[0-9][0-9_]*\.[0-9_]*/
                                , /[0-9][0-9_]*(\.[0-9_]*)?[eE][\+\-]?[0-9_]*/ )
  //, bsv_realLiteral: $ => choice( /[0-9][0-9_]*(.[0-9_]*)?[eE][\+\-]?[0-9_]*/
  //                              , /[0-9][0-9_]*.[0-9_]*/ )
  // string literals
  , bsv_stringLiteral: $ => /\".*\"/
  // identifiers
  , _bsv_identifier: $ => /[a-z][a-zA-Z0-9$_]*/
  , _bsv_Identifier: $ => /[A-Z][a-zA-Z0-9$_]*/
  // comments
  , _bsv_line_comment: $ => seq('//', /.*\n/)
  , _bsv_block_comment: $ => seq('/*', repeat(/./), '*/')
  }
, extras: $ => [/\s/, $._bsv_line_comment, $._bsv_block_comment]
});
