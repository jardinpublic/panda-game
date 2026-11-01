extends Node
## Language selection (autoload "Lang").
##
## The game ships in English and French. It starts in the browser or system
## language (French for any "fr*" locale, English otherwise) and can be
## switched live. Controls whose text is a translation key update themselves.

signal locale_changed(locale: String)

const SUPPORTED_LOCALES: PackedStringArray = ["en", "fr"]
const FALLBACK_LOCALE := "en"


func _ready() -> void:
	set_locale(pick_initial_locale(OS.get_locale_language()))


## Maps a system language code to a supported game locale.
static func pick_initial_locale(system_language: String) -> String:
	return "fr" if system_language.to_lower().begins_with("fr") else FALLBACK_LOCALE


## Returns the other supported locale (the one a toggle switches to).
static func other_locale(locale: String) -> String:
	return "en" if locale == "fr" else "fr"


func current_locale() -> String:
	return TranslationServer.get_locale().substr(0, 2)


func set_locale(locale: String) -> void:
	if locale not in SUPPORTED_LOCALES:
		locale = FALLBACK_LOCALE
	TranslationServer.set_locale(locale)
	locale_changed.emit(locale)


func toggle_locale() -> void:
	set_locale(other_locale(current_locale()))
