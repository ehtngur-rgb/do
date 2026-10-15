/**
 * Natural Language Understanding (NLU) Module
 * Interprets voice commands spoken in Korean for child-friendly robot interaction.
 * Short, crisp, and energetic responses for snappy interaction!
 */
class NLUParser {
    constructor() {
        this.wakeWords = ['로봇아', '친구야', '도우미야', '로봇', '헤이로봇', '헤이 로봇', '인공지능'];

        this.items = {
            box: {
                keywords: ['상자', '박스', '택배', '선물상자', '박스를', '상자를', '선물'],
                name: '상자'
            },
            bear: {
                keywords: ['인형', '곰인형', '곰돌이', '인형을', '곰인형을', '곰돌이를', '장난감'],
                name: '곰인형'
            },
            book: {
                keywords: ['책', '도서', '공책', '책을', '교과서'],
                name: '책'
            },
            ball: {
                keywords: ['공', '축구공', '탱탱볼', '농구공', '공을', '축구공을', '탱탱볼을'],
                name: '공'
            }
        };

        this.locations = {
            desk: {
                keywords: ['책상', '테이블', '책상위', '책상으로', '책상에', '책상위에'],
                name: '책상'
            },
            bed: {
                keywords: ['침대', '이불', '침대위', '침대로', '침대에', '침대위에'],
                name: '침대'
            },
            shelf: {
                keywords: ['선반', '책장', '수납장', '서랍장', '선반위', '선반으로', '선반에'],
                name: '선반'
            },
            floor: {
                keywords: ['바닥', '마루', '카페트', '카펫', '러그', '바닥으로', '바닥에'],
                name: '바닥'
            },
            basket: {
                keywords: ['바구니', '정리함', '장난감함', '통', '바구니에', '바구니로', '바구니안'],
                name: '바구니'
            },
            box: {
                keywords: ['상자위', '상자위에', '상자 위', '상자에', '상자로', '박스위', '박스위에', '상자속', '상자안', '상자'],
                name: '상자 위'
            }
        };
    }

    cleanText(text) {
        return text.trim().toLowerCase().replace(/[.,?!~]/g, '');
    }

    parse(rawInput) {
        let text = this.cleanText(rawInput);
        let hasWakeWord = false;

        // Check and strip wake word
        for (const w of this.wakeWords) {
            if (text.startsWith(w)) {
                hasWakeWord = true;
                text = text.substring(w.length).trim();
                break;
            } else if (text === w) {
                hasWakeWord = true;
                text = '';
                break;
            }
        }

        // 0. Only wake word called ("로봇아!", "친구야!")
        if (hasWakeWord && text.length === 0) {
            return {
                type: 'WAKE_WORD',
                rawText: rawInput,
                reply: '네! 준비됐어요. 말씀하세요!'
            };
        }

        // 1. Light On / Off
        if (text.includes('불 켜') || text.includes('불켜') || text.includes('조명 켜') || 
            text.includes('스탠드 켜') || text.includes('환하게') || text.includes('밝게') || 
            text === '불 켜' || text === '조명') {
            return {
                type: 'LIGHT_ON',
                rawText: rawInput,
                reply: '네! 방 불을 켤게요!'
            };
        }

        if (text.includes('불 꺼') || text.includes('불꺼') || text.includes('조명 꺼') || 
            text.includes('스탠드 꺼') || text.includes('어둡게') || text.includes('잘래') || 
            text.includes('취침') || text === '불 꺼') {
            return {
                type: 'LIGHT_OFF',
                rawText: rawInput,
                reply: '네! 방 불을 끌게요. 굿나잇!'
            };
        }

        // 2. Greeting / Wave
        if (text.includes('안녕') || text.includes('반가워') || text.includes('하이') || 
            text.includes('인사') || text.includes('손 흔들')) {
            return {
                type: 'GREET',
                rawText: rawInput,
                reply: '안녕! 난 도우미 로봇이야. 반가워!'
            };
        }

        // 3. Dance / Celebration
        if (text.includes('춤') || text.includes('댄스') || text.includes('신나게') || 
            text.includes('흔들어') || text.includes('노래')) {
            return {
                type: 'DANCE',
                rawText: rawInput,
                reply: '신나게 춤춰볼게요, 룰루랄라~!'
            };
        }

        // 4. Praise
        if (text.includes('고마워') || text.includes('잘했어') || text.includes('최고') || 
            text.includes('멋져') || text.includes('착하다') || text.includes('감사')) {
            return {
                type: 'PRAISE',
                rawText: rawInput,
                reply: '고마워요! 저도 정말 기뻐요!'
            };
        }

        // 5. Introduction / Who are you?
        if (text.includes('누구') || text.includes('이름') || text.includes('소개') || 
            text.includes('뭐 할 수 있어') || text.includes('할 줄 알아')) {
            return {
                type: 'INTRO',
                rawText: rawInput,
                reply: '난 손이 불편한 친구들을 돕는 AI 도우미 로봇이야!'
            };
        }

        // 6. Reset / Clean up
        if (text.includes('정리') || text.includes('청소') || text.includes('제자리') || 
            text.includes('원래대로') || text.includes('모두 제자리')) {
            return {
                type: 'RESET',
                rawText: rawInput,
                reply: '네! 모든 물건을 제자리로 정리할게요!'
            };
        }

        // 7. Come closer
        if (text.includes('이리와') || text.includes('이리 와') || text.includes('일로 와') || 
            text.includes('가까이 와') || text.includes('앞으로 와')) {
            return {
                type: 'COME',
                rawText: rawInput,
                reply: '슝슝~ 바로 앞으로 갈게요!'
            };
        }

        // 8. Finish Experience / Next Student Turn
        if (
            text.includes('체험 종료') || text.includes('체험종료') || 
            text.includes('체험 끝') || text.includes('체험끝') || 
            text.includes('체험 완료') || text.includes('체험완료') || 
            text.includes('다음 학생') || text.includes('다음학생') || 
            text.includes('다음 친구') || text.includes('다음친구') || 
            text.includes('다음 차례') || text.includes('다음차례') || 
            text.includes('다음 사람') || text.includes('다음사람') || 
            text.includes('처음으로') || text.includes('새로 시작') || 
            text.includes('다시 시작') || text === '종료' || text === '끝내기'
        ) {
            return {
                type: 'FINISH_EXPERIENCE',
                rawText: rawInput,
                reply: '축하해요! 오늘의 체험을 멋지게 마쳤어요! 다음 친구를 맞이할게요!'
            };
        }

        // 9. Move item command (Smart parser with particle priority and put-on/put-in verb handling)
        let targetItem = null;
        let destLocation = null;
        const isPutOnAction = text.includes('올려') || text.includes('얹어') || text.includes('올리');
        const isPutInAction = text.includes('넣') || text.includes('담') || text.includes('쏙') || text.includes('집어');

        // Avoid false positive where '책상' or '책장' matches '책' (book)
        const textWithoutFurniture = text.replace(/책상|책장/g, '');

        // If explicitly asking to put ON (e.g. "인형을 상자에 올려줘")
        if (isPutOnAction) {
            if (text.includes('상자') || text.includes('박스') || !destLocation) {
                destLocation = 'box';
            }
        }

        // Check if destination is box or basket when putting in
        if (isPutInAction) {
            if (text.includes('바구니') || text.includes('정리함')) {
                destLocation = 'basket';
            } else {
                destLocation = 'box';
            }

            // Identify which item to put in
            if (text.includes('공') || text.includes('축구공') || text.includes('탱탱볼')) {
                targetItem = 'ball';
            } else if (textWithoutFurniture.includes('책') || textWithoutFurniture.includes('도서') || textWithoutFurniture.includes('공책')) {
                targetItem = 'book';
            } else {
                // Default item is teddy bear
                targetItem = 'bear';
            }
        }

        // Priority 1: Check explicit object markers (을/를)
        if (!targetItem) {
            if (text.includes('인형을') || text.includes('곰인형을') || text.includes('곰돌이를')) {
                targetItem = 'bear';
            } else if (text.includes('상자를') || text.includes('박스를')) {
                targetItem = 'box';
            } else if (text.includes('공을') || text.includes('축구공을') || text.includes('탱탱볼을')) {
                targetItem = 'ball';
            } else if (text.includes('책을') || text.includes('도서를') || text.includes('공책을')) {
                targetItem = 'book';
            }
        }

        // Priority 2: Check destination markers (에/으로/로/안에/속에/위에)
        if (!destLocation) {
            if (text.includes('책상') || text.includes('테이블')) {
                destLocation = 'desk';
            } else if (text.includes('침대')) {
                destLocation = 'bed';
            } else if (text.includes('선반') || text.includes('책장')) {
                destLocation = 'shelf';
            } else if (text.includes('바닥') || text.includes('마루') || text.includes('카펫')) {
                destLocation = 'floor';
            } else if (text.includes('바구니') || text.includes('정리함')) {
                destLocation = 'basket';
            } else if (
                text.includes('상자') || text.includes('박스') || 
                text.includes('상자에') || text.includes('상자로') || text.includes('상자위') || text.includes('상자안') || 
                text.includes('박스에') || text.includes('박스로') || text.includes('박스위') || text.includes('박스안')
            ) {
                // Only if targetItem is not box itself
                if (targetItem !== 'box') {
                    destLocation = 'box';
                }
            }
        }

        // Fallback for targetItem if not found by explicit particle
        if (!targetItem) {
            if (text.includes('인형') || text.includes('곰') || text.includes('장난감')) {
                targetItem = 'bear';
            } else if (text.includes('공') || text.includes('축구공') || text.includes('탱탱볼')) {
                targetItem = 'ball';
            } else if (textWithoutFurniture.includes('책') || textWithoutFurniture.includes('도서')) {
                targetItem = 'book';
            } else if (text.includes('상자') || text.includes('박스') || text.includes('택배')) {
                targetItem = 'box';
            }
        }

        // Fallback for destination if not found
        if (!destLocation) {
            for (const [key, def] of Object.entries(this.locations)) {
                if (key === 'box' && targetItem === 'box') continue;
                for (const kw of def.keywords) {
                    if (text.includes(kw)) {
                        destLocation = key;
                        break;
                    }
                }
                if (destLocation) break;
            }
        }

        // Both found
        if (targetItem && destLocation) {
            if (targetItem === 'box' && destLocation === 'box') {
                destLocation = 'floor';
            }

            const itemName = this.items[targetItem].name;
            const locName = this.locations[destLocation].name;

            const itemWithJosa = window.josa ? window.josa(itemName, '을/를') : `${itemName}을`;
            const locWithJosa = window.josa ? window.josa(locName, '으로/로') : `${locName}으로`;

            let verb = '옮길게요!';
            if (destLocation === 'box' || isPutOnAction) {
                verb = '올릴게요!';
            } else if (destLocation === 'basket' || isPutInAction) {
                verb = '넣을게요!';
            }

            const locPhrase = destLocation === 'box' ? '상자 위로' : locWithJosa;

            return {
                type: 'MOVE',
                item: targetItem,
                destination: destLocation,
                rawText: rawInput,
                reply: `네! ${itemWithJosa} ${locPhrase} ${verb}`
            };
        }

        // Only item with action
        if (targetItem && (text.includes('옮겨') || text.includes('가져') || text.includes('치워') || text.includes('올려'))) {
            const defaultDest = targetItem === 'box' ? 'desk' : (targetItem === 'bear' ? 'bed' : 'shelf');
            const itemName = this.items[targetItem].name;
            const locName = this.locations[defaultDest].name;

            const itemWithJosa = window.josa ? window.josa(itemName, '을/를') : `${itemName}을`;
            const locWithJosa = window.josa ? window.josa(locName, '으로/로') : `${locName}으로`;

            return {
                type: 'MOVE',
                item: targetItem,
                destination: defaultDest,
                rawText: rawInput,
                reply: `네! ${itemWithJosa} ${locWithJosa} 옮길게요!`
            };
        }

        // Only destination with action
        if (destLocation && (text.includes('옮겨') || text.includes('가져') || text.includes('놔'))) {
            const locName = this.locations[destLocation].name;
            const locWithJosa = window.josa ? window.josa(locName, '으로/로') : `${locName}으로`;
            return {
                type: 'NEED_ITEM',
                destination: destLocation,
                rawText: rawInput,
                reply: `${locWithJosa} 어떤 물건을 옮길까요?`
            };
        }

        if (hasWakeWord) {
            return {
                type: 'UNKNOWN',
                rawText: rawInput,
                reply: '네! 상자나 인형을 어디로 옮겨줄까요?'
            };
        }

        // Fallback
        return {
            type: 'UNKNOWN',
            rawText: rawInput,
            reply: '잘 못 들었어요. "상자를 책상으로 옮겨줘"라고 해보세요!'
        };
    }
}

window.nluParser = new NLUParser();
