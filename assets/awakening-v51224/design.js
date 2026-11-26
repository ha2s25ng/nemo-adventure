(function(root){'use strict';
 const entries=[
 ['star','star-piercing','lucky','별의 개수가 늘어나고 관통 효과가 생깁니다.'],
 ['cannon','cannon-bounce','lucky','공이 다른 적에게 한 번 더 튀어 폭발합니다.'],
 ['orbit','orbit-bloom','jelly','회전 별이 적을 맞히면 별꽃 폭발이 일어납니다.'],
 ['moon','moon-return','coin','원반이 날아간 길을 되돌아오며 적을 관통합니다.'],
 ['bubble','bubble-split','magnet','방울이 터지면 작은 방울이 갈라져 적을 찾아갑니다.'],
 ['bloom','bloom-petal','honeypouch','꽃밭의 빛나는 꽃잎을 밟으면 체력이 회복됩니다.'],
 ['cloud','cloud-chain','courage','번개가 가까운 다른 적에게 이어집니다.'],
 ['ribbon','ribbon-echo','claw','반대 방향으로 리본이 다시 휘둘러집니다.'],
 ['book','book-chain','insight','종이비행기가 다른 적을 향해 한 번 더 날아갑니다.'],
 ['comet','comet-embers','emberheart','유성이 떨어진 자리에 별빛 잔불이 남습니다.'],
 ['frost','frost-freeze','cloak','수정에 반복해서 맞은 적이 잠시 얼어붙습니다.'],
 ['vortex','vortex-pulse','big','소용돌이가 주기적으로 퍼지며 더 먼 적을 감쌉니다.'],
 ['seed','seed-trail','shoes','걸어간 자리에 꽃길이 피어나 적을 공격합니다.'],
 ['bell','bell-ward','leafguard','종이 울리면 적을 밀어내고 가까운 탄환을 지웁니다.'],
 ['feather','feather-guide','windstep','돌아오는 깃털이 다른 적을 찾아 꺾여 날아옵니다.']
 ];
 const gimmicks={star:'세 갈래 별',cannon:'세 갈래 공',orbit:'회전 별 추가',moon:'넓어진 원반',bubble:'쌍둥이 방울',bloom:'넓어진 꽃밭',cloud:'먹구름 표식',ribbon:'넓어진 리본',book:'종이비행기 추가',comet:'유성 추가',frost:'쌍둥이 수정',vortex:'넓어진 소용돌이',seed:'씨앗 주머니',bell:'넓어진 울림',feather:'쌍둥이 깃털'};
 const steps=id=>({2:['강해진 마법','피해 강화'],3:['빠른 마법','공격 속도 강화'],4:[gimmicks[id],'공격 방식 강화'],5:['마법 집중','피해 강화'],6:['재빠른 마법','공격 속도 강화'],7:['완성된 마법','피해 강화']});
 root.NEMO_WEAPON_DESIGNS=Object.freeze({entries,steps,gimmicks});
})(globalThis);
