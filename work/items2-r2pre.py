# v2 revision: published-method derivations (3/51, High-Tech, Ultra-Tech), Ryuji's review fixes, corrected heat model.
import copy
from items import I as I1, DNF
I=copy.deepcopy(I1)
IDX={x['name']:k for k,x in enumerate(I)}
CHG={}   # name -> one-line change reason (for report)
def mod(_n,chg,**kw):
  x=I[IDX[_n]]; x.update(kw); CHG[kw.get("name",_n)]=chg
def rep(old,chg,**kw):
  k=IDX[old]; fac=I[k]['fac']; kw.setdefault('fac',fac); I[k]=kw; CHG[kw['name']]='REPLACES '+old+': '+chg

KE='HT anchors: M242 25mm 6dx4 pi++ (High-Tech p.137) and D-81TM 125mm APFSDS 6dx30(2) (High-Tech p.140-141) both give a base of 6d x 0.16 per mm of calibre; ammo multipliers from High-Tech pp.167-169 (APDS x1.3, APFSDS x1.5, APFSDSDU x1.7). The straight-line calibre scaling between those two published guns is my interpolation, not a published formula. Divisor: High-Tech gives (2); FORGE uses (3), the divisor 3/51 gives its TL10 railguns (Pyramid 3/51 p.27).'
HEMP='Ultra-Tech HEMP Warhead Table (p.155): 25/40/64/100mm = 6dx3/6dx5/6dx8/6dx12 (10) cr inc, about +0.12 multiplier per mm between rows (linear interpolation is mine). FORGE divisor (4): 3/51 armor is laminate, which doubles DR against shaped charges (Pyramid 3/51 p.24 and p.26; Pyramid 3/40 p.5), so (10) behaves like (5); FORGE steps that down one notch for TL8, matching the baseline rockets.'
MEL='No published mass-to-dice rule is in the supplied books: 3/51 (p.27) and 3/40 (p.5) both point to Low-Tech Companion 2 pp.20-21, which is not in the folder. Dice therefore use the baseline fit dice = 79 + 13 ln(t), rounded to nearest (extrapolated from the baseline vibroblades 64d/76d/88d), no multiplier, AVG = dice x 3.5.'
RNG_KE='RNG has no published conversion to the lower scale; interpolated by calibre between the baseline 30mm (113/458) and 45mm (135/518). Extrapolated.'

# ---------------- EMPIRE ----------------
mod('105mm SIEGE MORTAR','Damage re-derived from UT HEMP table (483 to 273), so mass/EP drop; Ryuji fixes: one-roll spotter, ACC 0, SPARE:0.',
 ep=3,mass='1.8 t',
 stats='ROF:1 DMG:6dx13(4) AVG:273 ACC:0 RCL:4 RNG:131/656 AMMO:4(1) SPARE:0 INDIRECT:-4_if_an_ally_with_LOS_made_a_SENSORS_roll_this_turn_else_-10 NOTE:indirect_fire_only NOTE:minimum_range_25',
 note='273(4) puts 148 through DR 500 per bomb, 4 bombs, against 190 per round (2 rounds, direct fire) for the 80mm ROCKET LAUNCHER at the same 3 EP. It pays with -4 (spotted) or -10 (blind) to hit and ACC 0, and it buys fire from behind cover. It is in ROCKET/MISSILE on purpose: 3/51\'s Active Defense System also intercepts indirect artillery (p.25), so anti-rocket gear applies.',
 deriv=HEMP+' 105mm sits just past the 100mm row: 6dx12 + 5 x 0.12 = 6dx12.6, rounded to 6dx13 (273). Indirect fire: High-Tech p.139 (observed indirect fire at -10, and the gunner gets no Acc), simplified to one SENSORS roll by an ally with line of sight (Ryuji). RNG keeps the baseline rocket pattern 1.25d/6.25d (the 60mm 75/375 and 120mm 150/750 fit it exactly); extrapolated.',
 eplogic='1.8 t gives 2.5 x sqrt(1.8) = 3.35, so EP 3.')
mod('35mm GARRISON AUTOCANNON','Re-derived via High-Tech calibre/ammo method (same 6dx10); RNG re-interpolated; SPARE:1.',
 stats='ROF:4 DMG:6dx10(3) AVG:210(840) ACC:4 RCL:2 RNG:120/478 AMMO:16(1) SPARE:1 RELIABLE:crit_fail_is_a_miss_not_a_malfunction',lv='35mm APFSDS-DU, 16-rd box',
 note='Against DR 500 it puts up to 4 x 43 = 172 through per turn (a ceiling: every round must hit), against 5 x 22 = 110 for the 30mm AUTOCANNON (3 EP). With SPARE:1 it carries 32 rounds (8 bursts), against the 30mm\'s 45 rounds (default 2 spares). It weighs 1.6 t against 1.1 t.',
 deriv=KE+' 35mm: 0.16 x 35 = 5.6, x1.7 APFSDSDU = 9.5, so 6dx10 (210). '+RNG_KE)
mod('IMPACT MAUL','Deleted the "-1 after a miss" status (scope creep); derivation relabelled.',
 stats='ROF:X DMG:94d(3) AVG:329 NOTE:any_penetrating_hit_forces_the_target_to_make_a_Stability_check',
 note='It puts 329 - 167 = 162 through DR 500, against 141 for the VIBROBLADE (HEAVY) (3 EP, 2.1 t), for 1 more EP and 1.1 t more mass. The payoff is the existing Stability check on every penetrating hit.',
 deriv=MEL+' 3.2 t gives 94.1, so 94d. Divisor (3): Ultra-Tech gives a crushing maul no divisor (vibro effects are for cutting/impaling, UT p.164), so (3) is parity with the baseline melee floor, a setting licence. The Stability check stands in for GURPS knockback.')
mod('60mm RIPPLE ROCKET BATTERY','Added SPARE:0; derivation now cites UT HEMP 64mm.',
 stats='ROF:6 DMG:4dx12(4) AVG:168(1008) ACC:5 RCL:4 RNG:75/375 AMMO:12(2) SPARE:0 NOTE:+2_Active_Defense_vs_missiles NOTE:fires_two_6-rocket_salvos',
 deriv='Same round as the baseline 60mm MISSILE POD. '+HEMP+' The baseline 4dx12 averages 168, which is exactly the UT HEMP 64mm row (6dx8 = 168), written with the 3/51 Light Missile Pod\'s x12 multiplier (p.27). RNG uses the baseline rocket pattern (75/375).')
mod('OLEUM BREACHING TORCH','Dropped the rads token; heat cut from +3 to +2 per hit.',
 stats='ROF:X DMG:76d(4) AVG:266 HEAT:+2/hit NOTE:requires_OLEUM_VIS_CORE NOTE:close_combat_only',
 note='It puts 266 - 125 = 141 through DR 500, against 99 for the VIBROBLADE (MEDIUM) (2 EP, 266 at (3)). It costs +2 heat per hit, which never bleeds off: five hits fill a Standard core.',
 deriv=MEL+' 0.8 t gives 76.1, so 76d. Divisor (4): this is the hand-held cousin of the 3/51 Plasma Lance, 6dx20(10) burn exp (p.27). Laminate doubles DR against plasma (p.24/p.27), so (10) acts like (5), and FORGE steps that down to (4) for an Empire item.')
rep('MANTLET SHIELD','duplicate of the TOWER SHIELD\'s deployable stands and created a free-standing cover object (Ryuji). The slot becomes a plain mid-size shield.',
 cat='D',name="IMPERIAL HEATER SHIELD",ep=4,stats='DR:200/120 HP:200',
 cls='SHIELD // HEATER SHIELD',mass='2.0 t',label='MATERIAL',lv='Laminated steel-ceramic heater',role='Large-shield armor at a lower EP',
 flavor='Every Imperial knight is issued one at investiture, and the old ones go to the chapel walls. Nobody re-paints the dents.',
 th=0,tl=8,exp=0,
 intent='Fills the gap between the MEDIUM SHIELD (3 EP) and the LARGE SHIELD (5 EP): it has Large-shield DR with less structure.',
 note='It has DR 200/120 and HP 200 for 4 EP, against the MEDIUM SHIELD\'s 180/90 and HP 160 (3 EP) and the LARGE SHIELD\'s 200/120 and HP 300 (5 EP).',
 deriv=None,
 eplogic='Shield curve: 2.0 t gives 3 x sqrt(2.0) = 4.2, so EP 4. DR 200/120 is half of the 3/51 Medium Shield\'s 400/240 (p.27), the same halving every baseline shield follows.')
rep('CROWN-GRADE SPALL LINER','flat DR:+60 and a "torso" location are not parsed by the sheet. Replaced by a percent-armor item that uses only live armStats tokens.',
 cat='D',name='CROWN-GRADE TOURNEY BARDING',ep=4,stats='DR:+20% MOVE:-10% HND:-1 NOTE:does_not_stack_with_other_percent_armor',
 cls='ARMOR // HEAVY BARDING',mass='2.8 t',label='MATERIAL',lv='Layered steel barding over the frame',role='Maximum passive armor for line knights',
 flavor='Tourney barding was meant for parades. Then the Crown noticed that the knights wearing it kept coming home.',
 th=0,tl=8,exp=0,
 intent='The Empire\'s heaviest percent armor: more DR than any other plating, paid for in speed and handling.',
 note='+20% takes a Medium frame from DR 500 to 600, against 550 for REINFORCED ARMOR (+10%, 3 EP) and 575 for LACQUERED O-YOROI (+15%, 4 EP, Reman). It costs 10% MOVE (9L becomes 8L) and 1 HND, both applied by the sheet through armStats. The largest percentage wins, so it never stacks with the others.',
 deriv=None,
 eplogic='2.8 t gives 2.5 x sqrt(2.8) = 4.2, so EP 4. Cross-check: 3/51 sells DR +30 to the whole mecha for 1 design point (p.25); +100 DR on a Medium is about 3 such steps, at the cost of Handling -1, which is itself a 1-point feature.')
mod('SMOKE DISCHARGERS','Counters (USES, 3-turn duration) and the beam-divisor rule replaced by the existing COVER modifier plus +1 heat.',
 stats='EFFECT:Ready_attacks_into_or_out_of_your_smoke_use_Targeter_COVER_-3_until_your_next_turn HEAT:+1/use NOTE:SENSOR_SUITE_tier_3_ignores',
 note='One Ready gives -3 to attacks into or out of the smoke until your next turn, for +1 heat. Compare COUNTERMEASURE POD (2 EP), which only cancels ACC bonuses. The 3/51 standard mecha already carries smoke dischargers (p.24), so this is a cheap TL8 equivalent.',
 eplogic='0.3 t gives 2.5 x sqrt(0.3) = 1.4, so EP 1. Smoke dischargers: High-Tech p.229.')
I[IDX['FIELD WORKSHOP RIG']]['stats']='TIER:1 REPAIR:5%_of_location_max_HP EFFECT:Ready_plus_ENGINEERING_roll_restores_HP_to_one_location_self_or_adjacent_ally HEAT:+2/use NOTE:cannot_restore_a_disabled_location'
I[IDX['FIELD WORKSHOP RIG']]['tiers']=[
 [2,'TIER:1 REPAIR:5%_of_location_max_HP EFFECT:Ready_plus_ENGINEERING_roll_restores_HP_to_one_location_self_or_adjacent_ally HEAT:+2/use NOTE:cannot_restore_a_disabled_location','0.4 t','Hip tool arm, ~2 kW','A welding arm and a parts bin: enough to keep a lance walking home.'],
 [4,'TIER:2 REPAIR:10%_of_location_max_HP EFFECT:Ready_plus_ENGINEERING_roll_restores_HP_to_one_location_self_or_adjacent_ally HEAT:+2/use NOTE:cannot_restore_a_disabled_location','0.9 t','Shoulder workshop, ~4 kW','A full field kit on a shoulder hardpoint. Squires fight over who gets to carry it.'],
 [6,'TIER:3 REPAIR:15%_of_location_max_HP EFFECT:Ready_plus_ENGINEERING_roll_restores_HP_to_one_location_self_or_adjacent_ally HEAT:+2/use NOTE:cannot_restore_a_disabled_location','1.6 t','Back-mounted forge, ~6 kW','A walking forge. The lance that brings one fights a second day.']]
mod('FIELD WORKSHOP RIG','USES and the off-sheet Mechanic roll replaced by an ENGINEERING roll plus +2 heat per use; repair rescaled to a % of location HP.',
 note='Tier 2 restores 10% of a location\'s max HP per success (about 22 on a Medium/Standard full location, 11 on a limb) for +2 heat. Heat, not a use counter, limits it. The TSUKUROI NANITE MENDER uses the same REPAIR token with no roll.')
mod('HERALDIC COMMAND MAST','Will bonus deleted; designation becomes a +1 ally ROLL MOD that does not stack with other ally-granted bonuses.',
 stats='EFFECT:designate_1_target/turn_allies_with_LOS_to_the_mast_add_+1_ROLL_MOD_vs_it RADIUS:300m NOTE:does_not_stack_with_other_ally-granted_bonuses NOTE:bearer_+2_to_enemy_detection NOTE:lost_if_head_destroyed',
 note='+1 for every ally against one designated target, typed into the existing ROLL MOD field. It does not stack with other ally-granted bonuses, which keeps the focus-fire ceiling near +5. The bearer is +2 to be detected.')
rep('OLEUM CHELATION INJECTOR','rads, FP, DX and USES are not tracked by the sheet (Ryuji: shelve until the rads counter ships).',
 cat='U',name='OLEUM SLURRY COOLANT FLUSH',ep=2,stats='NOTE:+2_to_ENGINEERING_vent_rolls NOTE:requires_OLEUM_VIS_CORE NOTE:refilled_by_Imperial_maintenance_crews_between_sorties',
 cls='UTILITY // COOLANT FLUSH',mass='0.6 t',label='FUEL',lv='Oleum slurry coolant loop',role='Faster venting for Oleum-fed knights',
 flavor='The Crown never trusted Oleum, so it built the plumbing first. Imperial Oleum knights vent faster than anyone, and they are reminded of why every time they do.',
 th=0,tl=8,exp=1,
 intent='An Empire answer to Oleum heat that uses the sheet\'s own vent roll: a flat +2 to the ENGINEERING vent roll.',
 note='At Engineering 14 on the OLEUM VIS CORE (VENT 2), +2 moves the expected shed per vent action from about 2.5 to about 3.5 heat. The OLEUM PURGE VALVE dumps all heat once; this is a steady edge on every vent.',
 deriv=None,
 eplogic='0.6 t gives 2.5 x sqrt(0.6) = 1.9, so EP 2.')
mod('RECOVERY TOW WINCH','Deleted cable HP and the ST-contest snag; the winch is lost when Utility is disabled.',
 stats='EFFECT:tow_one_disabled_ally_at_half_MOVE NOTE:lost_when_the_Utility_location_is_disabled',
 note='It does one thing: a disabled ally comes home at half MOVE. For 1 EP it is a pure campaign-economy item with no combat stats.')
mod('CASTELLAN SUPERHEAVY FRAME','Deleted BULK; HND 0 already lowers Dodge through the sheet.',
 stats='ST/HP:200 DR:800/400 MOVE:5L/10S SM:+7 HND:0 SR:3')
mod('TL8-ARMORED CARRIER','Rounding stated: 2 + 110/20 = 7.5, minus 2 for the troop bay = 5.5, rounded down to 5.',
 eplogic='Vehicle rule 2 + HP/20 = 2 + 5.5 = 7.5, minus 2 for the troop bay = 5.5, rounded down to 5 (vehicles round down, so the bay is never free).')
mod('ANCESTRAL THERMAL-MASS CORE','VENT polarity fixed (VENT 1 to VENT 3, since lower is better); RUGGED deleted.',
 stats='ST/HP:+40% HEAT:15 VENT:3 HND:-1',
 intent='A huge heat pool that is slow to empty: Empire knights can soak heat all day but pay dearly to shed it.',
 note='HEAT 15 (danger at 8) against the STANDARD FUSION CORE\'s 10 (danger at 5), but VENT 3 is the worst vent step: about 1.8 heat per vent action at Engineering 14, against 2.5 for VENT 2 and 4.6 for the HEAVY core\'s VENT 1. It costs 40% ST/HP against 50% for the Standard core at the same 3 EP.',
 eplogic='Reactor rule ST/HP% / 15 = 40/15 = 2.7, so 3. The large pool is paid for with the worst VENT and HND -1.')
mod('LONG-SERVICE THRUSTERS','Deleted RUGGED (the sheet has no crit table).',
 stats='MOVE:+20% HND:-1 SR:+2')
mod('DRESSED-LINE FIRE CONTROL','VOLLEY (counting allies on one target) replaced by a range-band bonus.',
 stats='ACC-ALL:+1 ACC-FAR:+1',
 intent='An Imperial line suite tuned for long-range volleys, with no dependence on allies.',
 note='+1 to everything and +2 in the FAR band, against STANDARD FIRE CONTROL (+1, 0 EP) and MULTI-ROLE (+2 everywhere, -2 EP). It sits between them at -1 EP.',
 eplogic='Targeting rule 1 - 1.5 x ACC-ALL = -0.5; the FAR-only +1 adds about half a step, giving -1.')

# ---------------- REBELS ----------------
mod('HAILSTORM 40mm ROTARY CANNON','Deleted SPINUP and the feed-destroyed status; SPARE:1; re-derived via High-Tech.',
 stats='ROF:5 DMG:6dx11(3) AVG:231(1155) ACC:3 RCL:3 RNG:128/498 AMMO:15(2) SPARE:1 HEAT:+3/burst',
 note='Up to 5 x 64 = 320 through DR 500 per turn (a ceiling; about 2-3 hits is typical at RCL 3), against 306 per 90mm HEAVY RIFLE hit. No single 64-point hit trips a Medium location\'s stability threshold. SPARE:1 gives 6 bursts, but +3 heat per burst redlines a Standard core in 4 bursts without venting, so heat is the real limit.',
 deriv=KE+' 40mm: 0.16 x 40 = 6.4, x1.7 APFSDSDU = 10.9, so 6dx11 (231). '+RNG_KE)
mod('BREACHER SCATTERGUN','Re-derived with the Ultra-Tech shotshell rule (damage /4, Rcl 1); SPARE:1.',
 stats='ROF:6 DMG:6dx6(3) AVG:126(756) ACC:2 RCL:1 RNG:40/150 AMMO:4(1) SPARE:1 NOTE:6_slugs_per_shot_counted_as_ROF NOTE:best_vs_REAR',
 lv='140mm slug canister, 4 shells',
 note='Against the front (DR 500) the slugs barely penetrate (126 - 167 < 0). With the REAR flag (x0.5 DR) each slug puts 43 through, up to 258 per shot. 8 shells with SPARE:1.',
 deriv='Ultra-Tech Shotshell (p.154): divide damage by 4, halve range, multiply RoF by 9, reduce Rcl to 1. The base is a 140mm full-bore slug by the High-Tech calibre rule (0.16 x 140 = 6dx22.4; '+'anchors High-Tech p.137 and p.140-141), /4 = 6dx5.6, rounded to 6dx6. FORGE trims RoF x9 to 6 heavier slugs to keep the per-shot ceiling at 258. Divisor (3) is FORGE\'s KE floor (3/51 p.27 railguns). RNG 40/150 is extrapolated (UT halves range; there is no published lower-scale value).')
mod('RIPSAW CHAIN BLADE','Deleted the jam status; dice rounded to nearest (83.4 to 83d).',
 stats='ROF:X DMG:83d(3) AVG:290.5 NOTE:crit_fail_throws_the_chain_and_destroys_it',
 note='It puts 290.5 - 167 = 123.5 through DR 500, against 99 for the VIBROBLADE (MEDIUM) (2 EP) and 141 for the HEAVY (3 EP, 2.1 t). The crit-fail destruction is its Rebel drawback.',
 deriv=MEL+' 1.4 t gives 83.4, so 83d. Divisor (3) = Ultra-Tech vibroblade (p.164).')
mod('SUNSPIKE THERMITE PROJECTOR','Re-derived as a UT HEMP thermite canister (now BALLISTIC, so Linked FC applies); target heat capped; tank rupture deleted; heat +3 to +2; SPARE:0.',
 cls='BALLISTIC // THERMITE CANISTER GUN',lv='100mm thermite canisters, 5 rounds',
 stats='ROF:1 DMG:6dx12(4) AVG:252 ACC:3 RCL:1 RNG:25/100 AMMO:5(1) SPARE:0 HEAT:+2/shot TARGET-HEAT:+1_on_penetrating_hit_max_+1_per_target_per_turn_cannot_raise_target_above_half_cap',
 note='252 - 125 = 127 through DR 500, against 190 for the 80mm ROCKET LAUNCHER (3 EP) at four times the range. Its edge is +1 heat on the target (at most +1 per target per turn, and never past half the target\'s cap). It can push a target to the edge of the danger zone, but the target\'s own weapons have to do the rest. 5 rounds, no spares.',
 deriv='Ultra-Tech HEMP Warhead Table (p.155) 100mm row: 6dx12(10) cr inc, the same figure as the 3/51 Light Missile Pod (p.27). The warhead is fired from a short gun rather than a rocket, so it is BALLISTIC. Divisor (10) to FORGE (4) for the laminate reason (3/51 p.24). RNG 25/100 is extrapolated (a low-velocity canister); 3/51\'s Plasma Lance is the closest short-range entry at 20/200 (p.27). The target heat is a GM-added +1 using the sheet\'s heat buttons.')
mod('HORNET 80mm ALPHA POD','Re-anchored on the baseline 80mm round (3/51 Heavy Missile Pod damage), so 6dx14 becomes 6dx15 and EP rises from 3 to 4; cook-off tied to the existing stability threshold.',
 ep=4,mass='2.6 t',
 stats='ROF:4 DMG:6dx15(4) AVG:315(1260) ACC:4 RCL:5 RNG:100/450 AMMO:4(1) SPARE:0 NOTE:one_salvo_no_reload NOTE:+2_Active_Defense_vs_missiles NOTE:if_its_location_takes_a_hit_over_the_stability_threshold_while_loaded_the_pod_cooks_off_for_6dx10(3)_to_that_location',
 note='One salvo of up to 4 x 190 = 760 through DR 500, against 2 x 190 = 380 over two turns for the 80mm ROCKET LAUNCHER (3 EP) and 344 for the 60mm MISSILE POD (2 EP). It fires once per sortie, has ACC 4, and cooks off when its location takes a big hit (3/51\'s Volatile feature, p.26).',
 deriv='Same 80mm round as the baseline 80mm ROCKET LAUNCHER, whose 5dx18 (AVG 315) equals the 3/51 Heavy Missile Pod\'s 6dx15(10) exactly (p.27). Written 6dx15 at FORGE (4) for the laminate reason (p.24). RNG copies the baseline 80mm (100/450). The cook-off uses UT HEMP 64mm-class damage (6dx8, p.155), rounded up to 6dx10 for the propellant.',
 eplogic='2.6 t gives 2.5 x sqrt(2.6) = 4.0, so EP 4.')
mod('SALVAGED LASER CARBINE','Re-anchored on the Ultra-Tech TL10 Laser Cannon (6dx11 to 6dx10); heat +2 to +1 per shot; lens and weather notes deleted.',
 stats='ROF:3 DMG:6dx10(3) AVG:210(630) ACC:6 RCL:1 RNG:150/500 HEAT:+1/shot NOTE:no_ammo',
 note='Up to 3 x 43 = 129 through DR 500 per turn for +3 heat, against 110 for the 30mm AUTOCANNON (3 EP), which has to reload. Its edge is ACC 6 and no magazine; its cost is heat that never bleeds off.',
 deriv='Ultra-Tech Laser Cannon (TL10) 6dx10(2) burn, Acc 18 (Ultra-Tech p.116): a salvaged Reman emitter. Divisor (2) to FORGE (3), which is the 3/51 Rainbow Laser\'s divisor (p.27). ACC is capped at the FORGE ceiling of 6. 3/51 runs beams on an energy bank (p.27, 15/30/60 shots); FORGE turns that bank into HEAT. RNG is extrapolated.')
I[IDX['SALVAGE PLATING KIT']]['stats']='TIER:1 PLATE:15 PLATE-USES:1 PLATE-HP:any'
I[IDX['SALVAGE PLATING KIT']]['tiers']=[
 [1,'TIER:1 PLATE:15 PLATE-USES:1 PLATE-HP:any','0.3 t','Door panels and hope','A few welded panels over the worst gaps.'],
 [2,'TIER:2 PLATE:25 PLATE-USES:1 PLATE-HP:any','0.6 t','Truck hull sections','Proper scrap plate, welded at awkward angles.'],
 [3,'TIER:3 PLATE:35 PLATE-USES:1 PLATE-HP:any','1.0 t',"Captured Imperial plate","Imperial plate, repainted, still wearing someone else's heraldry underneath."]]
mod('SALVAGE PLATING KIT','Flat DR and the per-hit DR strip (not parsed) replaced by the native PLATE tokens per tier.',
 note='Tier 2 (2 EP) takes 25% off the next penetrating hit on each component, at any HP, once. The baseline SACRIFICIAL PLATING (4 EP) is PLATE:25 but only on a full-HP component. Tier 3 (3 EP) at 35% is the best scrap plate, still below the REDUNDANT ACTUATOR HARNESS proposal (PLATE:50).',
 intent='Cheap Rebel ablative plate built on the sheet\'s own sacrificial-plating tokens.')
mod('REACTIVE ARMOR BRICKS','Per-location first-hit tracking, USES and ally splash replaced with a non-stacking SPACED-ARMOR-style divisor step.',
 stats='EFFECT:+2_armor_divisor_steps_vs_shaped_charge/rockets NOTE:does_not_stack_with_SPACED_ARMOR_PANELS NOTE:no_effect_vs_kinetic_beam_or_melee',
 note='Two divisor steps against shaped charges (so FORGE (4) becomes (2)) for 3 EP, against SPACED ARMOR PANELS\' one step for 2 EP. It doesn\'t stack with Spaced Armor, and the KAESHI change removes the third anti-rocket layer.')
mod('GRAPPLING HARPOON','Cable HP and the ST contest replaced with the JUMP-JET pattern.',
 stats='JUMP:reel_up_to_100m_to_terrain NOTE:Piloting_roll_to_land_cleanly',
 note='A reel to a point within 100m for 1 EP, against JUMP JETS (SHORT) (2 EP, up to half MOVE). It needs anchoring terrain and uses the same Piloting roll.')
mod('DECOY BEACON DROP','Beacon object HP, duration and USES replaced by a SENSORS vs EW contest (both sheet skills) plus +2 heat.',
 stats='EFFECT:Ready_the_next_ranged_attack_on_you_or_an_adjacent_ally_this_turn_must_win_SENSORS_vs_your_EW_or_miss HEAT:+2/use',
 note='One Ready forces one Quick Contest of SENSORS against your EW, for +2 heat. COUNTERMEASURE POD (2 EP) only removes ACC bonuses; this can make an attack miss outright, but only one attack per use, and only if the attacker loses the contest.')
mod('JURY-RIG FIELD KIT','USES and the off-sheet Mechanic roll replaced by ENGINEERING-2 plus +2 heat; works on disabled limbs (assumption A1).',
 stats='EFFECT:Ready_plus_ENGINEERING-2_restores_a_disabled_limb_to_1_HP HEAT:+2/use NOTE:fail_by_5+_the_limb_is_WRECKED NOTE:self_or_adjacent_ally',
 note='It brings a disabled limb back to 1 HP, so that arm\'s weapon works again (wDisabled clears), but the next hit disables it. The risk (failing by 5+ wrecks the limb) is the Rebel price.')
mod('MESH NET RELAY','Squad-wide shared sensor tier replaced by a personal +1 tier (max tier 2) while an allied suite is near (Ryuji).',
 stats='EFFECT:counts_as_SENSOR_SUITE_one_tier_higher_max_tier_2_while_an_allied_SENSOR_SUITE_is_within_500m NOTE:+1_to_enemy_detection',
 intent='A cheap Rebel way to borrow a friend\'s sensors, changing only the bearer\'s own sheet.',
 note='At most tier 2, so KITSUNE MIRAGE FIELD is halved rather than negated, SHINOBI tier 3 still works, and tier-3 effects (DECOY, SMOKE) are never reached. For 2 EP it is half the cost of a tier-1 suite upgrade (3 EP to 5 EP), and it needs a friend nearby.')
mod('TL8-TECHNICAL RAIDER','Deleted FRAGILE; 65 HP and DR 150 are already fragile, and a disabled Locomotion location already immobilizes it.',
 stats='ST/HP:65 DR:150/80 MOVE:8L/- SM:+3 HND:+3 SR:2 CREW:driver_and_gunner')
mod('OLEUM SPIKE CELL','VENT 3 to VENT 2 (lower is better); BREACH roll and per-turn rads deleted until the rads counter ships.',
 stats='ST/HP:+40% HEAT:10 VENT:2 HND:+1 NOTE:radiation_signature_+3_to_enemy_sensor_detection NOTE:Oleum_rads_per_the_OLEUM_VIS_CORE_once_the_rads_counter_ships',
 intent='A hot, hand-built Rebel core: standard-core heat handling and better handling, at the cost of structure and a glowing signature.',
 note='HEAT 10 / VENT 2 like the STANDARD FUSION CORE (3 EP), with HND +1 for 10% less ST/HP, and enemies get +3 to detect it. Against the LIGHT FISSION CELL (2 EP, 30%, HEAT 7, VENT 3), it vents better and holds more for 1 EP.',
 eplogic='Reactor rule 40/15 = 2.7, so 3. The HND +1 is paid for by the detection penalty. 3/40\'s Compact Power Plant (p.6) is the published model for a hot, volatile core.')
mod('POGO-JET HOP THRUSTERS','Deleted FRAGILE (the sheet has no crit table).',
 stats='MOVE:+10% JUMP:free_hop_up_to_1/4_MOVE_once_per_turn SR:-1')
mod('BURST CRUNCHER FIRE CONTROL','Manual RoF-step override and double-ammo rule replaced by a light ballistic specialisation.',
 stats='ACC-BALLISTIC:+1 ACC-ROCKET_MISSILE:-1',
 intent='A bootleg Rebel ballistic chip: a cheap, half-strength LINKED FIRE CONTROL.',
 note='+1 ballistic, -1 rockets at 0 EP, against LINKED FIRE CONTROL (BALLISTIC) +2/-1/-1 at -1 EP and STANDARD FIRE CONTROL +1 to everything at 0 EP. It only beats Standard for a pure-gun build that never uses melee.',
 eplogic='Targeting rule: a +1/-1 specialist nets to about +0, so 0 EP (half of LINKED\'s +2/-1/-1 at -1).')

# ---------------- REMANS ----------------
mod('HAGANE-YUMI GAUSS LONGBOW','Accepted. Damage now cited to 3/51\'s 40mm railgun (6dx25); SPARE:1; class mapped to BALLISTIC so Linked FC applies; (5) documented as Reman setting licence.',
 cls='BALLISTIC // COIL LONGBOW',
 stats='ROF:1 DMG:6dx25(5) AVG:525 ACC:6 RCL:2 RNG:200/640 AMMO:4(1) SPARE:1 HEAT:+4/shot DRAW:an_Aim_maneuver_is_required_before_every_shot',
 note='425 through DR 500 per bolt, against 400 for SKYFALL (5 EP, (4)) and 306 for the 90mm. It has 8 bolts with SPARE:1. +4 heat per bolt never bleeds off, so bolt 2 is in a Standard core\'s danger zone, and every shot needs an Aim turn (in which it can neither attack nor vent).',
 deriv='3/51 Railgun 40mm 6dx25(3) pi+ (Pyramid 3/51 p.27), adopted directly; 3/51 lists railguns under Gunner (Cannon) with ordinary guns, so it is BALLISTIC. The (5) is a Reman setting licence: 3/51 gives (3), and Ultra-Tech\'s (5) dart (APHD) is TL11. RNG 200/640 is extrapolated (3/51\'s 8,000/29,000 has no published lower-scale conversion). ACC 6 is the FORGE cap (3/51 gives Acc 8, x2/3 when handheld, p.27).')
mod('NAGINATA HIGH-FREQUENCY GLAIVE','Deleted REACH and the sweep (the sheet has no reach and the sweep is an extra roll).',
 stats='ROF:X DMG:80d(4) AVG:280',
 note='280 - 125 = 155 through DR 500, two-handed, against 141 for the VIBROBLADE (HEAVY) (3 EP, one-handed). It is a plain Reman polearm.',
 deriv=MEL+' 1.1 t gives 80.2, so 80d. Divisor (4) is a step between the Ultra-Tech vibroblade (3) and superfine vibroblade (5) (p.164).')
mod('WAKIZASHI GUARD BLADE','Divisor (5) to (4); deleted the free riposte and the unparsed Parry token.',
 stats='ROF:X DMG:67d(4) AVG:234.5 NOTE:one-handed_off-hand_blade_Parries_normally',
 note='234.5 - 125 = 109.5 through DR 500 at 2 EP, against 99 for the VIBROBLADE (MEDIUM) (2 EP, 0.9 t). It is a light Reman off-hand blade that Parries with the sheet\'s normal melee Parry. It no longer undercuts the KAGEROU TACHI\'s (5).',
 deriv=MEL+' 0.4 t gives 67.1, so 67d. Divisor (4) as for the Naginata.')
mod('HIKARI PARTICLE LANCE','Accepted. Damage set to the 3/51 Particle Beam exactly (6dx21 to 5dx20); heat +5 to +4; weather clause deleted.',
 stats='ROF:1 DMG:5dx20(5) AVG:350 ACC:6 RCL:0 RNG:120/400 HEAT:+4/shot NOTE:no_ammo',
 note='250 through DR 500 per shot with no magazine, for +4 heat, against 425 per Longbow bolt (5 EP, 8 bolts, Aim required) and 306 for the 90mm. Three shots fill a Standard core.',
 deriv='3/51 Particle Beam 5dx20(5) burn sur, Acc 15 (Pyramid 3/51 p.27), adopted directly. 3/51 feeds beams from the energy bank (15/30/60 shots by mecha size, p.27); FORGE converts the bank into HEAT. ACC 6 is the FORGE cap. RNG is extrapolated.')
mod('KAGEBOSHI REMOTE BITS','Bit HP and the undefined EW roll deleted; AMMO 16 with SPARE:0, +2 heat per turn used, and firing them counts as the turn\'s attack; re-derived via High-Tech.',
 cls='BALLISTIC // REMOTE WEAPON BITS',lv='4 coil-gun bits, 25mm, 4 volleys',
 stats='ROF:4 DMG:6dx7(3) AVG:147(588) ACC:4 RCL:0 RNG:100/400 AMMO:16(2) SPARE:0 HEAT:+2/turn_used REAR:apply_the_REAR_flag NOTE:firing_the_bits_is_the_attack_for_that_turn NOTE:cannot_combine_with_GAP NOTE:ECM_SUITE_tier_2+_in_radius_grounds_the_bits NOTE:lost_when_the_Utility_location_is_disabled',
 note='With the REAR flag, up to 4 x 64 = 256 through a Medium per volley (120 against a Heavy), 4 volleys a sortie, +2 heat each. It replaces your attack that turn, as in 3/51 (one weapon per turn, p.26). That compares with 110 per turn for the 30mm AUTOCANNON against the front.',
 deriv=KE+' 25mm coil darts: 0.16 x 25 = 4.0, x1.7 = 6.8, so 6dx7 (147). That is the High-Tech M242 25mm (6dx4, p.137) with DU sabot. RNG extrapolated.')
mod('HAKKEI DEFLECTOR FIELD','Renamed ...SHIELD so the sheet treats it as a shield; it must be held (Block interlock); DR capped at 240 (3/51 half rule); heat +3 to +2 per Block.',
 name='HAKKEI DEFLECTOR SHIELD',
 stats='DR:240/180 HP:250 HEAT:+2/Block NOTE:hand-held_emitter_held_like_any_shield NOTE:collapses_while_HEAT_is_in_redline',
 note='TOWER SHIELD DR (240/180) and half its HP (250) at 5 EP and 0.8 t, against the Tower\'s 7 EP and 5.2 t. Each Block adds +2 heat, so five Blocks fill a Standard core, and it collapses at redline.',
 eplogic='Electronics rule: a ~5 kW emitter gives EP 5. DR 240/180 is half of the 3/51 Large Shield (480/360, p.27), the same halving as every baseline shield.')
mod('KAESHI POINT-DEFENSE LASER','Per-turn intercept roll replaced by the baseline +Active Defense pattern (Dodge +2 vs rockets) at +2 heat.',
 stats='DEF:+2_Dodge_vs_ROCKET/MISSILE HEAT:+2/turn_used NOTE:no_effect_vs_kinetic_beam_or_melee',
 note='+2 to Dodge against rockets and missiles, the same size as the baseline 60mm pod\'s +2 Active Defense note, for +2 heat each turn it is used. It no longer negates hits, so with REACTIVE BRICKS it is two layers, not three.',
 eplogic='Electronics rule: ~3 kW gives EP 3. The 3/51 Active Defense System (p.25, intercept on 13 or less) is the published model; FORGE turns its roll into a Dodge bonus to avoid an extra roll.')
mod('SHUKUCHI FLASH-STEP','USES and the second Dodge after a hit replaced with a declared Dodge bonus at +4 heat.',
 stats='DEF:+3_to_one_Dodge_per_turn_declared_before_rolling HEAT:+4/use NOTE:no_effect_vs_area_or_salvo_attacks',
 note='+3 to one Dodge a turn for +4 heat. Two uses put a Standard core in the danger zone (which itself gives Dodge +1 and costs DR x0.75). Heat is the only limit, and it bites quickly.')
mod('TSUKUROI NANITE MENDER','USES and shrine refill replaced by +2 heat per use; shares the REPAIR % token with the FIELD WORKSHOP RIG.',
 stats='REPAIR:10%_of_location_max_HP EFFECT:Ready_restores_HP_to_one_location_self_or_adjacent_ally_no_roll HEAT:+2/use NOTE:cannot_restore_a_disabled_location',
 note='The same 10% as the FIELD WORKSHOP RIG at tier 2 (4 EP), with no roll, at 3 EP. Both cost +2 heat per use. The Reman edge is reliability, not size.')
rep('KAGURA OLEUM LANTERN','squad radius and rads tracking are not on the sheet, and its VENT -1 was a buff (Ryuji: shelve until rads ship).',
 cat='U',name='ONMYO OLEUM HEAT-SINK FINS',ep=2,stats='EFFECT:a_Ready_maneuver_sheds_2_HEAT_with_no_roll NOTE:requires_OLEUM_VIS_CORE NOTE:extended_fins_+1_to_enemy_detection',
 cls='UTILITY // HEAT-SINK FINS',mass='0.6 t',label='POWER',lv='Lattice fins on the back plate',role='Reliable venting for Oleum-fed knights',
 flavor='The fins open like a fan behind the shoulders and glow faintly blue. Reman pilots call it the bow before the strike.',
 th=0,tl=10,exp=1,
 intent='A Reman vent that never fails: a Ready sheds a flat 2 heat with no roll, as an alternative to the Engineering vent.',
 note='A guaranteed 2 heat per Ready, against an expected 1.6 (Engineering 12) or 2.5 (Engineering 14) from a VENT 2 vent roll on the OLEUM VIS CORE. It is best for low-Engineering pilots, and the open fins are +1 to detect.',
 deriv=None,
 eplogic='0.6 t gives 2.5 x sqrt(0.6) = 1.9, so EP 2.')
mod('TENGU-CLASS SKY FRAME','AIRTIME counter replaced by +2 heat per airborne turn; LOGISTICS uses 3/51 High Maintenance.',
 stats='ST/HP:125 DR:450/225 MOVE:8L/30S SM:+6 HND:+3 SR:1 NOTE:+2_HEAT_per_turn_airborne NOTE:High_Maintenance_-2_to_repair_rolls',
 note='Against the LIGHT FRAME (3 EP) it has +50 DR, +1 HND and 30S air MOVE, but every airborne turn adds +2 heat, so flight comes out of the heat pool. High Maintenance (3/51 p.25) gives -2 to repair rolls.')
mod('TL10-KAGO HOVER TANK','Skirt sub-location HP replaced by the vehicle Locomotion location; High Maintenance replaces LOGISTICS.',
 stats='ST/HP:140 DR:480/300 MOVE:6L/- SM:+4 HND:+2 SR:3 CREW:driver_gunner_commander NOTE:Locomotion_disabled_halves_MOVE_instead_of_stopping_it NOTE:High_Maintenance_-2_to_repair_rolls')
mod('TAMASHII RESONANCE CORE','VENT polarity fixed (VENT 3 to VENT 1); the ECM shutdown now worsens VENT to 3.',
 stats='ST/HP:+55% HEAT:11 VENT:1 SHUTDOWN:ECM_SUITE_tier_3_in_radius_raises_VENT_to_3 NOTE:High_Maintenance_-2_to_repair_rolls',
 intent='A Reman core that vents best of all, until a tier-3 jammer knocks its resonance out of tune.',
 note='VENT 1 (about 4.6 heat per vent at Engineering 14) like the HEAVY FUSION CORE (5 EP, 70%, HEAT 12), at 4 EP for 55% and HEAT 11. Against an enemy tier-3 ECM it drops to VENT 3, the worst in the catalog.')
mod('KAZE-NO-MAI VECTOR THRUSTERS','Accepted; LOGISTICS uses 3/51 High Maintenance.',
 stats='MOVE:+30% HND:+2 SR:-1 NOTE:High_Maintenance_-2_to_repair_rolls')
mod('ZANSHIN PREDICTIVE LINK','ACC-RANGED (never applied) replaced by live per-class penalties; the unparsed Parry token deleted.',
 stats='ACC-MELEE:+3 ACC-BALLISTIC:-1 ACC-ROCKET_MISSILE:-1 ACC-BEAM:-1',
 note='+3 melee and -1 to every ranged class the catalog uses (BALLISTIC, ROCKET_MISSILE, BEAM), against LINKED FIRE CONTROL (MELEE) +2/-1/-1 at -1 EP.',
 eplogic='Targeting rule: +3 in one class and -1 in the others is worth about +1.3 ACC-ALL, so 1 - 2 = -1, and FORGE charges -2 for the Reman edge.')
# Remove stale fields that referenced old mechanics
for x in I:
  x.setdefault('deriv',None)
def fx(n,**kw): I[[x['name'] for x in I].index(n)].update(kw)
fx('OLEUM BREACHING TORCH',intent='An Oleum-fed cutter. It is the Empire\'s one high-penetration melee tool, and the pilot pays for it in heat.')
fx('SMOKE DISCHARGERS',intent='A low-tech screen that uses the sheet\'s existing COVER modifier, for anyone who needs to break line of fire.',lv='Multispectral smoke grenades')
fx('FIELD WORKSHOP RIG',intent='A tiered squad repair tool. It runs on the sheet\'s ENGINEERING roll and costs heat, so it is reliable but slow.')
fx('RECOVERY TOW WINCH',intent='A pure rescue tool: it gets a disabled ally home.')
fx('LONG-SERVICE THRUSTERS',intent='Dependable thrusters that keep the frame steady, at the cost of speed and handling.',
   note='Against STANDARD THRUSTERS (2 EP, +25%) it gives up 5% Move and 1 HND for SR +2.')
fx('HAILSTORM 40mm ROTARY CANNON',intent='Rebel raw burst: big per-turn damage, fast ammo burn and heat that piles up.')
fx('RIPSAW CHAIN BLADE',intent='Heavy-blade damage in one hand, with a chance of destroying itself.')
fx('SALVAGED LASER CARBINE',intent='Salvaged Reman TL10 tech: no ammo and very accurate, paid for in heat.')
fx('REACTIVE ARMOR BRICKS',intent='A stronger, non-stacking cousin of SPACED ARMOR PANELS against HEAT and rockets.')
fx('DECOY BEACON DROP',intent='Electronic warfare that can pull one attack off you or a neighbour, using the sheet\'s SENSORS and EW skills.')
fx('POGO-JET HOP THRUSTERS',note='LIGHTWEIGHT THRUSTERS (1 EP) give +15%. These give up 1 EP and 5% Move for a free quarter-Move hop every turn, at SR -1.')
fx('NAGINATA HIGH-FREQUENCY GLAIVE',intent='A two-handed Reman polearm: more damage than a heavy vibroblade, both hands committed.',role='Two-handed melee damage')
fx('HIKARI PARTICLE LANCE',intent='A TL10 heavy beam with unlimited shots, limited by heat.')
fx('KAGEBOSHI REMOTE BITS',intent='Gundam-style bits that hit rear armor from any facing, limited by ammo, heat and the ECM ladder.')
fx('SHUKUCHI FLASH-STEP',intent='A declared Dodge boost paid for in heat. Salvos and area attacks ignore it.')
fx('SHINOBI SIGNATURE DAMPERS',intent='Tiered self-stealth. The matching Sensor tier beats it, and heat shuts it off.')
fx('TENGU-CLASS SKY FRAME',eplogic='The frame rule gives (125 - 87.5) / 12.5 = 3, so EP 3. The extra DR and flight are paid for in heat while airborne and High Maintenance (3/51 p.25).')
fx('TL10-KAGO HOVER TANK',intent='A Reman hover tank, twice as fast as Imperial armor, that limps rather than stops when its lift is hit.',
   note='Against the TL8-TANK (8 EP, 120 HP, DR 300/180, 3L) it gets +17% HP, +60% DR, double Move and +1 EP. A disabled Locomotion location halves its Move, and High Maintenance gives -2 to repair rolls.',
   flavor='It crosses rivers our tanks must bridge and fields our tanks must bypass. Its lift fans, thankfully, are made of cloth-weave and pride.')
