/* Registers every surface under the id the rail, GO_ALIAS and the URL hash use.
   Imported once, for its side effects, by the shell.
   PAGES.demat = PAGES.ids and PAGES.account = PAGES.closure in the reference;
   the aliases are kept so any published path still lands somewhere sensible. */
import { registerPage } from './registry'
import { BasicPage, PersonalPage } from './personal'
import { ContactPage } from './contact'
import { NomineePage } from './nominee'
import { BanksPage } from './banks'
import { SegmentsPage } from './segments'
import { DematPage } from './demat'
import { MarginPage, BrokeragePage } from './calculators'
import { PricingPage } from './pricing'
import { PrefsPage } from './prefs'
import { PrivacyPage } from './privacy'
import { SecurityPage } from './security'
import { DocumentsPage } from './documents'
import { ReportsPage } from './reports'
import { ClosurePage } from './closure'
import { HomePage } from './home'

registerPage('home', HomePage)
registerPage('basic', BasicPage)
registerPage('personal', PersonalPage)
registerPage('contact', ContactPage)
registerPage('nominee', NomineePage)
registerPage('banks', BanksPage)
registerPage('segments', SegmentsPage)
registerPage('demat', DematPage)
registerPage('ids', DematPage)
registerPage('reports', ReportsPage)
registerPage('pricing', PricingPage)
registerPage('margin', MarginPage)
registerPage('brokerage', BrokeragePage)
registerPage('prefs', PrefsPage)
registerPage('privacy', PrivacyPage)
registerPage('security', SecurityPage)
registerPage('documents', DocumentsPage)
registerPage('closure', ClosurePage)
registerPage('account', ClosurePage)
