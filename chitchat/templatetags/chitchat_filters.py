from django import template
import html
register = template.Library()

@register.filter(name='ellipses')
def ellipses(message_string, max_length=20):
	message_string = html.unescape(message_string)
	if len(message_string) <= max_length:
		return message_string
	else:
	    return message_string[:max_length] + "..."
