/**
 * Natural Language Understanding (NLU) Module
 * Interprets voice commands spoken in Korean for child-friendly robot interaction.
 * Short, crisp, and energetic responses with 100% exact matches to audio_cache.
 */
class NLUParser {
    constructor() {
        this.wakeWords = [
            '로보야', '로보', '로봇아', '로봇', '로보트야', '로보트',
            '로보야안녕', '로봇아안녕', '로보안녕', '로봇안녕',
            '안녕로보야', '안녕로봇아', '안녕로보',
            '친구야', '도우미', '도우미야', '인공지능',
            '헤이로보', '헤이 로보', '헤이로봇', '헤이 로봇',
            '러버', '로부야', '로보야뭐해', '로봇아뭐해'
        ];

        this.items = {
            box: {
                keywords: ['상자', '박스', '택배', '선물상자', '선물', '상자를', '박스를', '상자도', '박스도'],
                name: '상자'
            },
            bear: {
                keywords: ['인형', '곰인형', '곰돌이', '테디베어', '장난감', '인형을', '곰인형을', '곰돌이를', '인형도', '곰도'],
                name: '곰인형'
            },
            book: {
                keywords: ['책', '도서', '공책', '동화책', '교과서', '책을', '도서를', '공책을', '책도'],
                name: '책'
            },
            ball: {
                keywords: ['공', '축구공', '탱탱볼', '농구공', '야구공', '공을', '축구공을', '탱탱볼을', '공도'],
                name: '공'
            }
        };

        this.locations = {
            desk: {
                keywords: ['책상', '테이블', '책상위', '책상으로', '책상에', '책상위에', '탁자', '공부책상', '책상쪽'],
                name: '책상'
            },
            bed: {
                keywords: ['침대', '이불', '침대위', '침대로', '침대에', '침대위에', '매트리스', '침대쪽'],
                name: '침대'
            },
            shelf: {
                keywords: ['선반', '책장', '수납장', '서랍장', '선반위', '선반으로', '선반에', '선반위에', '장식장', '선반쪽'],
                name: '선반'
            },
            floor: {
                keywords: ['바닥', '마루', '카페트', '카펫', '러그', '바닥으로', '바닥에', '아래', '밑', '바닥쪽'],
                name: '바닥'
            },
            basket: {
                keywords: ['바구니', '정리함', '장난감함', '통', '바구니에', '바구니로', '바구니안', '바구니속'],
                name: '바구니'
            },
            box: {
                keywords: ['상자위', '상자위에', '상자 위', '상자에', '상자로', '박스위', '박스위에', '상자속', '상자안', '박스안', '상자쪽'],
                name: '상자 위'
            }
        };

        // Complete Exact Pre-recorded Response Map for Move Commands
        this.moveReplies = {
            'box_desk': '네! 상자를 책상으로 옮길게요!',
            'box_bed': '네! 상자를 침대로 옮길게요!',
            'box_shelf': '네! 상자를 선반으로 옮길게요!',
            'box_floor': '네! 상자를 바닥으로 옮길게요!',
            'bear_box': '네! 곰인형을 상자 위로 올릴게요!',
            'bear_bed': '네! 곰인형을 침대로 옮길게요!',
            'bear_desk': '네! 곰인형을 책상으로 옮길게요!',
            'bear_shelf': '네! 곰인형을 선반으로 옮길게요!',
            'ball_bed': '네! 공을 침대로 옮길게요!',
            'ball_desk': '네! 공을 책상으로 옮길게요!',
            'ball_basket': '네! 공을 바구니에 넣을게요!',
            'ball_shelf': '네! 공을 선반으로 옮길게요!',
            'book_shelf': '네! 책을 선반으로 옮길게요!',
            'book_desk': '네! 책을 책상으로 옮길게요!',
            'book_bed': '네! 책을 침대로 옮길게요!'
        };
    }

    cleanText(text) {
        if (!text) return '';
        return text.trim().toLowerCase().replace(/[.,?!~"'“”]/g, '');
    }

    parse(rawInput) {
        let text = this.cleanText(rawInput);
        if (!text) {
            return {
                type: 'UNKNOWN',
                rawText: rawInput,
                reply: '잘 못 들었어요. "상자를 책상으로 옮겨줘"라고 해보세요!'
            };
        }

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

        // Check standalone wake greetings like "안녕 로보야"
        if (text === '안녕' || text === '반가워' || text === '하이') {
            if (hasWakeWord) {
                return {
                    type: 'GREET',
                    rawText: rawInput,
                    reply: '안녕! 난 도우미 로봇이야. 반가워!'
                };
            }
        }

        // 0. Only wake word called ("로보야!", "로봇아!")
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
            text.includes('불 좀 켜') || text === '불 켜' || text === '불켜줘' || text === '조명') {
            return {
                type: 'LIGHT_ON',
                rawText: rawInput,
                reply: '네! 방 불을 켤게요!'
            };
        }

        if (text.includes('불 꺼') || text.includes('불꺼') || text.includes('조명 꺼') || 
            text.includes('스탠드 꺼') || text.includes('어둡게') || text.includes('잘래') || 
            text.includes('취침') || text.includes('불 좀 꺼') || text === '불 꺼' || text === '불꺼줘') {
            return {
                type: 'LIGHT_OFF',
                rawText: rawInput,
                reply: '네! 방 불을 끌게요. 굿나잇!'
            };
        }

        // 2. Greeting / Wave
        if (text.includes('안녕') || text.includes('반가워') || text.includes('하이') || 
            text.includes('인사') || text.includes('손 흔들') || text.includes('반갑')) {
            return {
                type: 'GREET',
                rawText: rawInput,
                reply: '안녕! 난 도우미 로봇이야. 반가워!'
            };
        }

        // 3. Dance / Celebration
        if (text.includes('춤') || text.includes('댄스') || text.includes('신나게') || 
            text.includes('흔들어') || text.includes('노래') || text.includes('몸 흔들')) {
            return {
                type: 'DANCE',
                rawText: rawInput,
                reply: '신나게 춤춰볼게요, 룰루랄라~!'
            };
        }

        // 4. Praise
        if (text.includes('고마워') || text.includes('잘했어') || text.includes('최고') || 
            text.includes('멋져') || text.includes('착하다') || text.includes('감사') || 
            text.includes('잘한다') || text.includes('대단')) {
            return {
                type: 'PRAISE',
                rawText: rawInput,
                reply: '고마워요! 저도 정말 기뻐요!'
            };
        }

        // 5. Introduction / Who are you?
        if (text.includes('누구') || text.includes('이름') || text.includes('소개') || 
            text.includes('뭐 할 수 있어') || text.includes('할 줄 알아') || text.includes('너는')) {
            return {
                type: 'INTRO',
                rawText: rawInput,
                reply: '난 손이 불편한 친구들을 돕는 AI 도우미 로봇이야!'
            };
        }

        // 6. Reset / Clean up
        if (text.includes('정리') || text.includes('청소') || text.includes('제자리') || 
            text.includes('원래대로') || text.includes('모두 제자리') || text.includes('원위치')) {
            return {
                type: 'RESET',
                rawText: rawInput,
                reply: '네! 모든 물건을 제자리로 정리할게요!'
            };
        }

        // 7. Come closer
        if (text.includes('이리와') || text.includes('이리 와') || text.includes('일로 와') || 
            text.includes('가까이 와') || text.includes('앞으로 와') || text.includes('일루 와') || 
            text.includes('앞으로')) {
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
            text.includes('다시 시작') || text === '종료' || text === '끝내기' || 
            text.includes('교대')
        ) {
            return {
                type: 'FINISH_EXPERIENCE',
                rawText: rawInput,
                reply: '오늘 체험을 멋지게 마쳤어요! 다음 친구를 맞이할 준비를 할게요!'
            };
        }

        // 9. Move item command (Smart parser supporting kid phrases & inverted word order)
        let targetItem = null;
        let destLocation = null;

        // Disambiguate '책' from furniture '책상', '책장'
        const textWithoutFurniture = text.replace(/책상|책장/g, '');

        // Check Item identification
        if (text.includes('인형') || text.includes('곰인형') || text.includes('곰돌이') || text.includes('테디베어') || text.includes('장난감')) {
            targetItem = 'bear';
        } else if (text.includes('공') || text.includes('축구공') || text.includes('탱탱볼') || text.includes('농구공') || text.includes('야구공')) {
            targetItem = 'ball';
        } else if (textWithoutFurniture.includes('책') || textWithoutFurniture.includes('도서') || textWithoutFurniture.includes('공책') || textWithoutFurniture.includes('동화책') || textWithoutFurniture.includes('교과서')) {
            targetItem = 'book';
        }

        // Check Destination identification first (Desk, Bed, Shelf, Floor, Basket)
        if (text.includes('책상') || text.includes('테이블') || text.includes('탁자')) {
            destLocation = 'desk';
        } else if (text.includes('침대') || text.includes('이불') || text.includes('매트리스')) {
            destLocation = 'bed';
        } else if (text.includes('선반') || text.includes('책장') || text.includes('수납장') || text.includes('서랍장') || text.includes('장식장')) {
            destLocation = 'shelf';
        } else if (text.includes('바닥') || text.includes('마루') || text.includes('카펫') || text.includes('카페트') || text.includes('러그') || text.includes('아래')) {
            destLocation = 'floor';
        } else if (text.includes('바구니') || text.includes('정리함') || text.includes('장난감함') || text.includes('통')) {
            destLocation = 'basket';
        }

        // Check Box / Basket as Destination (Only if targetItem is bear/ball/book)
        if (targetItem && targetItem !== 'box' && !destLocation) {
            if (text.includes('상자') || text.includes('박스') || text.includes('택배')) {
                destLocation = 'box';
            }
        }

        // If targetItem still not found, check if the item is 'box'
        if (!targetItem) {
            if (text.includes('상자') || text.includes('박스') || text.includes('택배') || text.includes('선물상자')) {
                targetItem = 'box';
            }
        }

        // When placing bear, if user says "상자에 넣어줘" or "상자에 올려줘" -> dest is box
        if (targetItem === 'bear' && !destLocation && (text.includes('상자') || text.includes('박스') || text.includes('올려') || text.includes('넣어'))) {
            destLocation = 'box';
        }

        // When ball + "넣어줘" -> dest is basket (or bed if bed mentioned)
        if (targetItem === 'ball' && !destLocation && (text.includes('넣어') || text.includes('담아') || text.includes('쏙'))) {
            destLocation = 'basket';
        }

        // Both Item and Destination successfully identified
        if (targetItem && destLocation) {
            // Guard: Box cannot be placed into box
            if (targetItem === 'box' && destLocation === 'box') {
                destLocation = 'desk'; // Default sensible slot
            }

            const key = `${targetItem}_${destLocation}`;
            const exactReply = this.moveReplies[key] || `네! ${this.items[targetItem].name}을 ${this.locations[destLocation].name}으로 옮길게요!`;

            return {
                type: 'MOVE',
                item: targetItem,
                destination: destLocation,
                rawText: rawInput,
                reply: exactReply
            };
        }

        // Item identified + Action verb present without explicit destination -> Use sensible quest default
        const hasMoveVerb = text.includes('옮겨') || text.includes('가져') || text.includes('치워') || 
                            text.includes('올려') || text.includes('넣어') || text.includes('놔') || 
                            text.includes('놓아') || text.includes('둬') || text.includes('보내');

        if (targetItem && hasMoveVerb) {
            const defaultDest = (targetItem === 'box') ? 'desk' : 
                                (targetItem === 'bear') ? 'box' : 
                                (targetItem === 'ball') ? 'bed' : 'shelf';

            const key = `${targetItem}_${defaultDest}`;
            const exactReply = this.moveReplies[key] || `네! ${this.items[targetItem].name}을 옮길게요!`;

            return {
                type: 'MOVE',
                item: targetItem,
                destination: defaultDest,
                rawText: rawInput,
                reply: exactReply
            };
        }

        // Item only without verb -> Ask where to move
        if (targetItem && !destLocation) {
            return {
                type: 'NEED_DEST',
                item: targetItem,
                rawText: rawInput,
                reply: '어디로 옮길까요? 책상, 침대, 선반 중에 말씀해 주세요!'
            };
        }

        // Destination only without item -> Ask which item to move
        if (!targetItem && destLocation) {
            return {
                type: 'NEED_ITEM',
                destination: destLocation,
                rawText: rawInput,
                reply: '어떤 물건을 옮길까요? 상자, 곰인형, 공, 책 중에 말씀해 주세요!'
            };
        }

        // Wake word alone fallback
        if (hasWakeWord) {
            return {
                type: 'WAKE_WORD',
                rawText: rawInput,
                reply: '네! 준비됐어요. 말씀하세요!'
            };
        }

        // Final Fallback: Helpful hint
        return {
            type: 'UNKNOWN',
            rawText: rawInput,
            reply: '잘 못 들었어요. "상자를 책상으로 옮겨줘"라고 해보세요!'
        };
    }
}

window.nluParser = new NLUParser();
